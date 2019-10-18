<template>
	<div class="visualization scrollbar">
		<table v-if="setup" class="setup-table">
			<template>
				<tr>
					<td>Contrast</td>
					<td><vue-slider class="slider" :silent="true" v-model="matrixOptions.contrast" :tooltipPlacement="'right'" :max="20" :min="1" :interval="1"/></td>
				</tr>
				<tr>
					<td>Matrix size</td>
					<td><vue-slider class="slider" :silent="true" v-model="matrixOptions.cellSize" :tooltipPlacement="'right'" :max="100" :min="3" :interval="1"/></td>
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
		<CoocurenceMatrix :matrix="attributesMatrix" :labels="attributesNames" :weights="attributesWeights"
			:sizeType="matrixOptions.sizeType" :valueType="matrixOptions.valueType" :contrast="matrixOptions.contrast / 10"
			:cellSize="matrixOptions.cellSize">
		</CoocurenceMatrix>		
	</div>
</template>

<script>
import VueSlider from 'vue-slider-component';
import CoocurenceMatrix from "./CoocurenceMatrix.vue";
export default {
	name: "AttributesMatrix",
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
		},
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
	},
	methods: {

	},
	components: {
		CoocurenceMatrix, VueSlider
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
	width: 250px;
}
.setup-table select {
	width: 100%;
}
.setup-table td,th { padding: 5px; }
</style>
