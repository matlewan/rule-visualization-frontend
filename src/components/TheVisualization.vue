<template>
	<div class="visualization scrollbar">
		<table v-if="setup" class="setup-table">
			<tr>
				<th>Visualization</th>
				<th><select v-model="type">
					<option value="A">Attributes matrix</option>
					<option value="M">Rules matrix</option>
					<option value="R">Rules graph</option>
				</select></th>
			</tr>
			<template v-if="type == 'A' || type == 'M'">
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
				<tr v-if="type=='M' && matrixOptions.sizeType == 'D'">
					<td>Rule weight</td>
					<td><select v-model="matrixOptions.ruleWeight">
						<option v-for="c in characteristics" :key="c.name" :value="c.name">{{c.name}}</option>
					</select></td>
				</tr>
			</template>
		</table>
		<CoocurenceMatrix v-if="type=='A'" :matrix="attributesMatrix" :labels="attributesNames" :weights="attributesWeights"
			:sizeType="matrixOptions.sizeType" :valueType="matrixOptions.valueType" :contrast="matrixOptions.contrast / 10"
			:cellSize="matrixOptions.cellSize">
		</CoocurenceMatrix>
		<RulesGraph>
			
		</RulesGraph>
		
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
		type: 'A',
		alpha: 0.4, beta: 0.4, gamma: 0.2,
		similarityMatrix: [],
		links: []
	}},
	computed: {
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
			var similarity = 0;
			var conditions = r1.conditions.concat(r2.conditions)
				.sort( (a,b) => (a.name < b.name ? -1 : 1) );
			for (var i = 1; i < conditions.length; i++) {
				if (c1.name == c2.name) {
					var len = domains[c1.name].length;
					var value = alpha + (1-alpha) * Math.abs(c2.value - c1.value) / len;
					similarity += value;
					i++;
				}				
			}
			return (2 * similarity) / (similarity + 0.5 * conditions.length);
		},
		coverageSimilarity(r1, r2) {
			var union = new Set(...r1.__examples, ...r2.__examples);
			var intersectionSize = r1.__examples.length + r1.__examples.length - union.length;
			return intersectionSize / union.length; // Jaccard measure
		},
		computeLinks() {
			var idx = this.rules.map(r => r.id-1), n = idx.length;
			var set = new Set(idx);
			var matrix = [];
			var rows = this.similarityMatrix.filter((_, index) => set.has(index));
			for (var i = 0; i < n; i++) {
				matrix.push(rows[i].filter((_, index) => set.has(index)));
			}
			this.filteredSimilarityMatrix = matrix;
		},
		computeSrcLinks() {
			var matrix = []; // pseudo matrix (half matrix)
			var rules = this.srcRules, n = rules.length;
			for (var i = 0; i < n; i++) {
				matrix.push(new Array(n-i).fill({semantic: 0, coverage: 0}));
				rules.coverage = 0;
			}
			this.computeSemanticSimilarityMatrix(matrix, n);
			this.computeCoverage(matrix, n, rules);
			this.computeLinks();
		},
		computeSemanticSimilarityMatrix(matrix, n) {
			for (var i = 0; i < n; i++) {
			for (var j = i+1; j < n; j++) {
				matrix[i][j].semantic = this.semanticSimilarity(rules[i], rules[j]);
			}}
		},
		computeCoverage(matrix, n, rules) {
			for (var r of rules)
				r.__examples = new Set();
			for (var i = 0; i < this.examples.length; i++) {
				for (var ruleId of this.examples[i].__rules) {
					r.__examples.add(i);
				}
			}
			
			for (var i = 0; i < n; i++) {
				var r1 = rules[i], n1 = r1.examples.length;
				r1.coverage = n1;
				for (var j = i+1; j < n; j++) {
					var r2 = rules[j], n2 = r2.examples.length;
					var union = new Set(...r1.examples, ...r2.examples);
					var intersection = n1 + n2 - union.length;
					matrix[i][j].coverage = intersection / union.length; // Jaccard measure
				}
			}
			for (var r of rules)
				r.__examples = undefined;
		},
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
</style>
