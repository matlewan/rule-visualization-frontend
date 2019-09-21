<template>
    <div class="scrollbar">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Display name</th>
                    <th>Type</th>
                    <!-- <th>Value</th> -->
                    <th>Value type / domain</th>
                    <th>Active</th>
                    <th>Filter</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Steps</th>
					<!-- <th>Example</th> -->
                    <!-- <th>Display</th> -->
                </tr>
            </thead>
            <tbody>
                <tr v-for="attribute of attributes" :key="attribute.id">
                    <td><input class="rounded-input" v-model="attribute.dispName"></td>
                    <td>{{ attribute.identifierType != undefined ? "id" : attribute.preferenceType }}</td>
                    <!-- <td>{{ attribute.valueType }}</td> -->
                    <td>{{ attribute.identifierType != undefined ? attribute.identifierType : attribute.domain != undefined ? attribute.domain.join(', ') : attribute.valueType }}</td>
                    <td><input type="checkbox" v-model="attribute.active" disabled=true></td>
                    <td><input type="checkbox" v-model="attribute.dispFilter"></td>
					<template v-if="attribute.domain == undefined && attribute.identifierType == undefined">
						<td><input type="number" v-model.number="attribute.min"></td>
						<td><input type="number" v-model.number="attribute.max"></td>
						<td><input type="number" v-model.number="attribute.intervals"></td>
					</template>
					<template v-else><td></td><td></td><td></td></template>
                    <!-- <td><input type="checkbox" v-model="attribute.example"></td> -->
                    <!-- <td><input type="checkbox" v-model="attribute.display"></td> -->
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
  name: "Attributes",
  props: {
      attributes: Array
  }
};



</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
	table {
		display: inline-block;
        white-space: pre;
    }
    table { margin: 0; }
    table thead th {
        position: sticky;
        top: 0;
        background-color: white;
        border: 0;
    }
    .table-sm td,th { padding: 5px 10px !important; }

	input[type="number"] { width: 60px; float: left; text-align: right; }

    
</style>
