<template>
	<div class="visualization scrollbar">
		<table v-if="setup" class="setup-table">
			<tr>
				<th>Visualization</th>
				<th><select v-model="type">
					<option value="A">Attributes matrix</option>
					<option value="R">Rules graph</option>
				</select></th>
			</tr>
			<template v-if="type == 'A'">
				<tr>
					<td>Contrast</td>
					<td><vue-slider class="slider" :silent="true" v-model="matrixOptions.contrast" :max="20" :min="1" :interval="1"/></td>
				</tr>
				<tr>
					<td>Matrix size</td>
					<td><vue-slider class="slider" :silent="true" v-model="matrixOptions.cellSize" :max="100" :min="3" :interval="1"/></td>
				</tr>
				<tr>
					<td>Cell value</td>
					<td><select v-model="matrixOptions.valueType">
						<option value="P">Relative to row</option>
						<option value="C">Absolute</option>
					</select></td>
				</tr>
				<tr>
					<td>Cell size</td>
					<td><select v-model="matrixOptions.sizeType">
						<option value="F">Fixed</option>
						<option value="D">Weighted</option>
					</select></td>
				</tr>
			</template>
		</table>
		<CoocurenceMatrix v-if="type=='A'" :matrix="attributesMatrix" :labels="attributesNames" :weights="attributesWeights"
			:sizeType="matrixOptions.sizeType" :valueType="matrixOptions.valueType" :contrast="matrixOptions.contrast / 10"
			:cellSize="matrixOptions.cellSize">
		</CoocurenceMatrix>
		<div id="graph" v-if="type=='R'" >
			<RulesGraph :nodes="nodes" :links="links" :setup="setup" :characteristics="characteristics">
			
			</RulesGraph>
		</div>
		
	</div>
</template>

<script>
import VueSlider from 'vue-slider-component';
import CoocurenceMatrix from "./CoocurenceMatrix.vue";
import RulesGraph from "./RulesGraph.vue";
export default {
	name: "TheVisualization",
	props: {
		attributes: Array,
		rules: Array,
		srcRules: Array,
		characteristics: Array,
		examples: Array,
		setup: Boolean,
	},
	data() { return {
		matrixOptions: { // attributes matrix options
			valueType: 'P', // P - percentage (coocurences divided by attribute count), C - count
			contrast: 10,
			sizeType: 'F', // F - fixed, D - dynamic
			cellSize: 45,
			ruleWeight: ''
		},
		type: 'R',
		srcLinksAtMost: [],
		srcLinksAtLeast: [],
		semanticSimilarityThreshold: 0, // should be the same as minimum value in RulesGraph.vue semantic filter
		coverageSimilarityThreshold: 0, // should be the same as minimum value in RulesGraph.vue semantic filter
	}},
	computed: {
		links() {
			return this.srcLinksAtMost.filter(link => {
				return link.coverage >= this.coverageSimilarityThreshold && link.semantic >= this.semanticSimilarityThreshold;
			});
		},
		nodes() {
			return this.rulesAtMost;
		},
		rulesAtLeast() {
			return this.srcRules.filter( (rule) => {
				var decision = rule.decisions[0][0];
				var attribute = this.attributes.find(a => a.name == decision.name);
				return (attribute.type == 'gain') == (decision.operator == '>=')
			});
		},
		rulesAtMost() {
			return this.srcRules.filter( (rule) => {
				var decision = rule.decisions[0][0];
				var attribute = this.attributes.find(a => a.name == decision.name);
				return (attribute.type == 'gain') != (decision.operator == '>=')
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
		attributesNames() {
			return this.attributes.map(a => a.name);
		},
		attributesWeights() {
			return new Array(this.attributes.length).fill(0).map( (v, i) => this.attributesMatrix[i][i]);
		},
		attributesMatrix() {
			var matrix = []; // pseudo matrix (half matrix)
			var n = this.attributes.length;
			for (var i = 0; i < n; i++)
				matrix.push(new Array(n).fill(0));
			for (var rule of this.rules) {
				var attributes = rule.conditions.map(c => this.attributes.findIndex(a => a.name == c.name));
				for (var i = 0; i < attributes.length; i++)
					for (var j = i; j < attributes.length; j++) {
						var a1 = attributes[i], a2 = attributes[j];
						matrix[a1][a2]++;
						matrix[a2][a1] = matrix[a1][a2];
					}			
			}
			return matrix;
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
				if (semantic >= this.semanticSimilarityThreshold || coverage >= this.coverageSimilarityThreshold) {
					links.push({'source': rules[i].id, 'target': rules[j].id, 'semantic': semantic, 'coverage': coverage});
				}
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
		CoocurenceMatrix, VueSlider, RulesGraph
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
.setup-table {
	width: 300px;
}
.setup-table td,th { padding: 5px; }

#graph {
	display: flex;
	flex-direction: column;
	flex: 1;
}
</style>
