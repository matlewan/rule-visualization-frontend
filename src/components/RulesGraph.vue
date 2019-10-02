<template>
	<div class="rules-graph">

	</div>
</template>

<script>
import * as d3 from "d3";
export default {
	name: "RulesGraph",
	props: {
		nodes: Array,
		edges: Array,
		alpha: {type: Number, default: 0.5},
		options: Object,
	},
	data() { return {
		
	}},
	watch: {
		
	},
	computed: {
		
	},
	mounted() {  },
	methods: {
		generate() {
			this.drop();
			
			if (this.matrix.length == 0) return;

			var force = d3.layout.force()
				.nodes(nodes)
				.links(links)
				.size([w, h])
				.linkStrength(0.1)
				.friction(0.9)
				.linkDistance(20)
				.charge(-30)
				.gravity(0.1)
				.theta(0.8)
				.alpha(0.1)
				.start();
		}
	},
}
</script>

<style scoped>
.rules-graph {
	flex: 1;
}
</style>
