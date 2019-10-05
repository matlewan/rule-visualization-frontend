<template>
	<div :class="divClass">

	</div>
</template>

<script>
import * as d3 from "d3";
export default {
	name: "Histogram",
	props: {
		data: Array,
		width:   { type: Number, default: 500 },
		height:  { type: Number, default: 500 },
		buckets: { type: Number, default: 10 },
		margin:  { type: Number, default: 25 },
		color:	 { type: String, default: "#69b3a2"},
		divClass: String,
	},
	data() { return {
		
	}},
	watch: {
		data: function() { 
			this.generate(); 
		},
		buckets: function() {
			this.generate();
		}
	},
	mounted() {
		this.generate();
	},
	computed: {
		max() { return this.data.reduce( (a,b) => a > b ? a : b); },
		class() { return '.' + this.divClass; }
	},
	methods: {
		drop() {
			d3.select(this.class).select("*").remove();
		},
		generate() {
			this.drop();
			if (this.data.length == 0) return;
			var margin = {top: this.margin, right: this.margin, bottom: this.margin, left: this.margin};
			var width = this.width - margin.left - margin.right;
			var height = this.height - margin.top - margin.bottom;
			var svg = d3.select(this.class)
				.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
				.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			var x = d3.scaleLinear()
				.domain([0, this.max])
				.range([0, width]);
			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x));

			var histogram = d3.histogram()
				.value(d => d)  
				.domain(x.domain())  
				.thresholds(this.buckets); 

			var bins = histogram(this.data);
			var maxY = bins.map(b => b.length).reduce( (a,b) => a > b ? a : b);
			var y = d3.scaleLinear()
				.range([height, 0]);
				y.domain([0, maxY]);   // d3.hist has to be called before the Y axis obviously
			svg.append("g")
				.call(d3.axisLeft(y));

			// append the bar rectangles to the svg element
			svg.selectAll("rect")
				.data(bins)
				.enter()
				.append("rect")
					.attr("x", 1)
					.attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
					.attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
					.attr("height", function(d) { return height - y(d.length); })
					.style("fill", this.color)
				}
	},
}
</script>

<style scoped>

</style>
