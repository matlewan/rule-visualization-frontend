<template>
	<div id="rules-graph">
		<button @click="$parent.computeSrcLinks">Compute</button>
		<button @click="generate">Generate</button>
		<div class="svg">
			
		</div>
	</div>
</template>

<script>
import * as d3 from "d3";
export default {
	name: "RulesGraph",
	props: {
		nodes: Array,
		links: Array,
		options: Object,
	},
	data() { return {
		
	}},
	watch: {
		
	},
	computed: {
		
	},
	mounted() {
		window.d3 = d3;
	},
	methods: {
		drop() {
			d3.select("#rules-graph > .svg").select("svg").remove();
		},
		generate() {
			this.drop();
			if (this.links.length == 0) return;

			var svg = d3.select("#rules-graph > .svg")
				.append("svg")
					.attr("width", '100%')
					.attr("height", '100%')
					.attr('viewbox', '0, 0, 100, 100');

			// var force = d3.layout.force()
			// 	.nodes(nodes)
			// 	.links(links)
			// 	.size([w, h])
			// 	.linkStrength(0.1)
			// 	.friction(0.9)
			// 	.linkDistance(20)
			// 	.charge(-30)
			// 	.gravity(0.1)
			// 	.theta(0.8)
			// 	.alpha(0.1)
			// 	.start();

			var simulation = d3.forceSimulation()
              .force("center", d3.forceCenter(50, 50))                  
              .force("charge", d3.forceManyBody())
			  .force("link", d3.forceLink().id(d =>   d.id));
			  
			//define links group
			var my_group = svg.selectAll(".link_group")
				.data(this.links)
			//exit, remove
			my_group.exit().remove()
			//enter
			var enter = my_group.enter()
								.append("g").attr("class","link_group")
			//append
			enter.append("line").attr("class","link_line")
			//merge
			my_group = my_group.merge(enter)
			my_group.select("link_line")
					.attr("stroke", "orange");

			//define nodes group
			var my_group = svg.selectAll(".node_group")
				.data(this.nodes)
			//exit, remove
			my_group.exit().remove()
			//enter
			var enter = my_group.enter()
								.append("g").attr("class","node_group")
			//append 
			enter.append("circle").attr("class","node_circle")
			//merge
			my_group = my_group.merge(enter)
			my_group.select("node_circle")
					.attr("fill", "orange")
					.attr("r",10)

			simulation.nodes(this.nodes)
			simulation.force("link").links(this.links)

			simulation.on("tick",function(d){
			//position links
			d3.selectAll(".link_line")
				.attr("x1", d => d.source.x)
				.attr("x2", d => d.target.x)
				.attr("y1", d => d.source.y)
				.attr("y2", d => d.target.y)
				.attr("style", d => "stroke:rgb(0,0,0); stroke-width:4");
			
			//position nodes
			d3.selectAll(".node_circle")
				.attr("cx", d => 0)
				.attr("cy", d => 0)
				.attr("r", d => 10)
				.attr("fill", "orange");
			})
			simulation.alpha(1).restart()
		}
	},
}
</script>

<style scoped>
#rules-graph {
	flex: 1;
	position: relative;
}
#rules-graph > .svg {
	position: absolute !important;
	left: 0; top: 0; right: 0; bottom: 0 !important;
	width: 100%; height: 100% !important;
	z-index: -1;
}
#rules-graph > button {
	z-index: 1;
}
</style>

