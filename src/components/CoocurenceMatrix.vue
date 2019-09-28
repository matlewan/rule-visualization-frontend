<template>
	<div class="coocurence-matrix">
		<b>Cooccurence</b>
		<div class="gradient" :style="gradStyle"></div>
	</div>
</template>

<script>
import * as d3 from "d3";
export default {
	name: "CoocurenceMatrix",
	props: {
		matrix: Array,
		labels: Array,
		weights: Array,
		valueType: String,
		cellSize: Number,
		contrast: Number,
		sizeType: String,
		margin:  { type: Number, default: 25 },
	},
	data() { return {
		colors: ['#ffffff', '#ffff00', '#ff0000', '#000000']
	}},
	watch: {
		matrix: 	function() 	{ this.generate(); }, 
		weights: 	function() 	{ this.generate(); }, 
		valueType: 	function() 	{ this.generate(); }, 
		contrast: 	function() 	{ this.generate(); },
		cellSize: 	function() 	{ this.generate(); },
		sizeType: 	function() 	{ this.generate(); },
	},
	computed: {
		gradStyle() { return 'background-image: linear-gradient(to right, '+ this.colors.join(',') + ')'; },
		offsets() { return new Array(this.colors.length).fill(0).map((v,i) => {return i/(this.colors.length-1); }); }
	},
	mounted() { this.generate(); },
	methods: {
		drop() {
			d3.select(".coocurence-matrix").select("svg").remove();
		},
		generate() {
			this.drop();
			if (this.matrix.length == 0) return;
			var margin = {top: this.margin, right: this.margin, bottom: this.margin, left: this.margin};
			var size = this.cellSize * this.matrix.length, width = size, height = size;
			var textSize = 200;
			var svg = d3.select(".coocurence-matrix")
				.append("svg")
					.attr("width", width + margin.left + margin.right + textSize)
					.attr("height", height + margin.top + margin.bottom)
				.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			svg.append('rect')
				.attr('x', 0).attr('y', 0).attr('width', width).attr('height', height).attr('fill', 'black');
			
			var x = d3.scaleLinear()
				.domain([0, this.matrix.length])
				.range([0, width]);
			var y = x;
			var color = d3.scaleLinear()
				.domain(this.offsets)
				.range(this.colors);
			
			var weights = this.weights;
			var maxValue = weights.reduce( (a,b) => a > b ? a : b);
			var sumValue = weights.reduce( (a,b) => a+b );


			var contrast = this.contrast, valueType = this.valueType, matrix = this.matrix, cellSize = this.cellSize;
			var fColor = function(v, i) {
				var divider = (valueType == 'P' ? matrix[i][i] : maxValue);
				var value = (v + 0.5) / (divider + 1);
				value = Math.pow(value, contrast);
				return color(value);
			}

			var sizes, pos = [0];
			if (this.sizeType == 'F')
				sizes = weights.map(v => cellSize);
			else
				sizes = weights.map(v => cellSize*weights.length*v / sumValue);
			sizes.reduce( (a,b) => { pos.push(a); return a+b;})

			var local = d3.local();
			var g = svg.selectAll("g")
				.data(matrix)
				.enter()
				.append("g")
					.attr("transform", (r, i) => "translate("+[pos[i], 0].join(',')+")")
					.attr('i', (v,i) => i);
			g.selectAll("rect")
				.data( (v, i) => v )
				.enter()
				.append("rect")
					.attr('y', (v,i) => pos[i]+1)
					.attr('x', 1)
					.attr("width", (v, i, j) => Math.max(sizes[j[i].parentElement.getAttribute("i")] - 2, 0))
					.attr("height", (v,i) => Math.max(0, sizes[i] - 2) )
					.style("fill", (v, i, j) => (j[i].parentElement.getAttribute("i") == i ? "#bbbbff" : fColor(v,i)));
			var selection = svg.selectAll('text')
				.data(this.labels)
				.enter()
			selection.append('text')
				.attr('y', (v,i) => sizes[i]/2 + 6 + pos[i])
				.attr('x', width+5)
				.text((v,i) => (sizes[i] == 0 ? "" : (i+1 + ". " + v)));
			selection.insert('text')
				.attr('y', (v,i) => sizes[i]/2 + 6 + pos[i])
				.attr('x', -20)
				.text((v,i) => (sizes[i] == 0 ? "" : i+1));
			selection.insert('text')
				.text((v, i) => (sizes[i] == 0 ? "" : i+1))
				.attr('x', (v,i) => sizes[i]/2 - 6 + pos[i])
				.attr('y', height+15);
			selection.insert('text')
				.text((v, i) => (sizes[i] == 0 ? "" : i+1))
				.attr('x', (v,i) => sizes[i]/2 - 6 + pos[i])
				.attr('y', -5);
		}
	},
}
</script>

<style scoped>
.gradient {
	width: 350px;
	height: 20px;
}
</style>
