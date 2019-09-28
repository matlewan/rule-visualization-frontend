<template>
	<div class="chart">

	</div>
</template>

<script>
import * as d3 from "d3";
export default {
	name: "BaseChart",
	props: {
		data: Array,
		width:   { type: Number, default: 500 },
		height:  { type: Number, default: 500 },
		margin:  { type: Number, default: 25 },
		color:	 { type: String, default: "#69b3a2"}
	},
	data() { return {
		
	}},
	watch: {
		data: function() { 
			this.generate(); 
		},
	},
	mounted() {
		this.generate();
	},
	computed: {
		max() { return this.data.reduce( (a,b) => a > b ? a : b); }
	},
	methods: {
		drop() {
			d3.select(".chart").selectAll("*").remove();
		},
		generate() {
			this.drop();
			if (this.data.length == 0) return;
			var margin = {top: 10, right: 10, bottom: this.margin, left: this.margin};
			var width = this.width - margin.left - margin.right;
			var height = this.height - margin.top - margin.bottom;
			var svg = d3.select(".chart")
				.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
				.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			var x = d3.scaleBand()
				.domain(this.data.map(d => d.value))
				.range([0, width]);
			svg.append("g")
				.attr("transform", "translate(0," + height + ")")
				.call(d3.axisBottom(x));

			var maxY = this.data.map(d => d.count).reduce( (a,b) => a > b ? a : b);
			var y = d3.scaleLinear()
				.range([height, 0]);
				y.domain([0, maxY]);   // d3.hist has to be called before the Y axis obviously
			svg.append("g")
				.call(d3.axisLeft(y));

			// append the bar rectangles to the svg element
			var bar = svg.selectAll("rect")
				.data(this.data)
				.enter().append("rect")
					.attr("x", d => { return x(d.value); })
					.attr("y", d => { return y(d.count); })
					.attr("width", x.bandwidth()-1)
					.attr("height", d => { return height - y(d.count); })
					.style("fill", this.color);
			}
	},
}
</script>

<style scoped>

</style>
