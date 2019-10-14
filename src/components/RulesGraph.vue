<template>
	<div class="visualization scrollbar" id="graph">
		<RulesGraphLayout :nodes="nodes" :links="links" :setup="setup" :characteristics="characteristics"
						  :options="options" :rules="rules">
		</RulesGraphLayout>
	</div>
</template>

<script>
import VueSlider from 'vue-slider-component';
import RulesGraphLayout from "./RulesGraphLayout.vue";
export default {
	name: "RulesGraph",
	props: {
		attributes: Array,
		rules: Array,
		srcRules: Array,
		characteristics: Array,
		examples: Array,
		setup: Boolean,
	},
	data() { return {
		srcLinksAtMost: [],
		srcLinksAtLeast: [],
		options: {
			'Semantic': { value: 0.55, min: 0, max: 1, interval: 0.01},
			'Coverage': { value: 0.55, min: 0, max: 1, interval: 0.01},
			ruleId: undefined,
			rulesType: 'L',
		},
	}},
	computed: {
		links() {
			return (this.options.rulesType == 'L' ? this.srcLinksAtLeast : this.srcLinksAtMost);
		},
		nodes() {
			return (this.options.rulesType == 'L' ? this.rulesAtLeast : this.rulesAtMost);
		},
		rulesAtLeast() {
			return this.srcRules.filter( (rule) => {
				var decision = rule.decisions[0][0];
				var attribute = this.attributes.find(a => a.name == decision.name);
				return (attribute.preferenceType == 'gain') == (decision.operator == '>=');
			});
		},
		rulesAtMost() {
			return this.srcRules.filter( (rule) => {
				var decision = rule.decisions[0][0];
				var attribute = this.attributes.find(a => a.name == decision.name);
				return (attribute.preferenceType == 'gain') != (decision.operator == '>=')
			});
		},
		domains() {
			var attr = {};
			for (var a of this.attributes) {
				attr[a.name] = {
					min: a.min,
					max: a.max,
					length: (a.domain != undefined) ? a.domain.length : a.max - a.min,
				}
			}
			return attr;
		},
	},
	methods: {
		semanticSimilarity(r1, r2) {
			var similarity = 0, alpha = 0.5, pairs = 0;
			var conditions = r1.conditions.concat(r2.conditions)
				.sort( (a,b) => (a.name < b.name ? -1 : 1) );
			for (var i = 1; i < conditions.length; i++) {
				var c1 = conditions[i-1], c2 = conditions[i];
				if (c1.name == c2.name) {
					var len = this.domains[c1.name].length;
					var value = 1 - alpha * Math.abs(c2.value - c1.value) / len;
					similarity += value;
					i++; pairs++;
				}				
			}
			return 2 * similarity / conditions.length;
		},
		coverageSimilarity(r1, r2) {
			if (r1.__examples.size == 0 || r2.__examples.size == 0)
				return 0;
			var union = new Set([...r1.__examples, ...r2.__examples]);
			var intersectionSize = r1.__examples.size + r2.__examples.size - union.size;
			return intersectionSize / union.size; // Jaccard measure
		},
		computeSrcLinks() {
			this.fillRuleExamples();
			this.srcLinksAtLeast = this.srcLinks(this.rulesAtLeast);
			this.srcLinksAtMost = this.srcLinks(this.rulesAtMost);
			this.dropRuleExamples();
		},
		srcLinks(rules) {
			var links = [], n = rules.length;
			for (var i = 0; i < n; i++) {
			for (var j = i+1; j < n; j++) {
				var semantic = this.semanticSimilarity(rules[i], rules[j]);
				var coverage = this.coverageSimilarity(rules[i], rules[j]);
				links.push({'source': rules[i].id, 'target': rules[j].id, 'semantic': semantic, 'coverage': coverage});
			}}
			return links;
		},
		fillRuleExamples() {
			for (var r of this.srcRules)
				r.__examples = new Set();
			for (var i = 0; i < this.examples.length; i++) {
				for (var ruleId of this.examples[i].__rules) {
					this.srcRules[ruleId].__examples.add(i);
				}
			}
		},
		dropRuleExamples() {
			for (var r of this.srcRules)
				r.__examples = undefined;
		},
	},
	watch: {
		srcRules: function() {
			this.computeSrcLinks();
		}
	},
	components: {
		VueSlider, RulesGraphLayout
	}
}
</script>

<style scoped>
.visualization {
	overflow: auto;
	display: flex;
	flex-direction: column;
	width: 100%;
	margin: 0 10px 5px 0;
}
#graph {
	display: flex;
	flex-direction: column;
	flex: 1;
}
</style>
