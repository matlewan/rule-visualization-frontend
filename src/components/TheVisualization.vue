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
		<CoocurenceMatrix v-if="type=='M'" :matrix="rulesMatrix" :labels="rulesNames" :weights="rulesWeights"
			:sizeType="matrixOptions.sizeType" :valueType="matrixOptions.valueType" :contrast="matrixOptions.contrast / 10"
			:cellSize="matrixOptions.cellSize">
		</CoocurenceMatrix>
	</div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import CoocurenceMatrix from "./CoocurenceMatrix.vue"
export default {
	name: "TheVisualization",
	props: {
		attributes: Array,
		rules: Array,
		characteristics: Array,
		setup: Boolean,
	},
	data() { return {
		matrixOptions: {
			valueType: 'P', // P - percentage (coocurences divided by attribute count), C - count
			contrast: 10,
			sizeType: 'F', // F - fixed, D - dynamic
			cellSize: 45,
			ruleWeight: ''
		},
		type: 'A',
	}},
	computed: {
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
		characteristicsNames() {
			return this.characteristics.map(c => c.name);
		},
		rulesNames() {
			return this.rules.map(r => 'Rule #' + r.id);
		},
		rulesWeights() {
			var n = this.rules.length;
			return this.rules.map( r => n*n*r.characteristics[this.matrixOptions.ruleWeight]);
		},
		rulesMatrix() {
			var matrix = new Array(this.rules.length).fill(new Array(this.rules.length).fill(0));
			var n = this.rules.length;
			for (var i = 0; i < n; i++)
			for (var j = 0; j < n; j++) {
				var value = i+j;
				matrix[i][j] = value;
			}
			return matrix;
		}
	},
	methods: {
		getCharacteristic(name) { return this.characteristics.find(c => c.name == name); },
	},
	components: {
		CoocurenceMatrix, VueSlider
	}
}
</script>

<style scoped>
.visualization {
	overflow: auto;
}
.setup-table td,th { padding: 5px; }
</style>
