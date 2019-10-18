<template>
    <div class="characteristics-table scrollbar">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Display name</th>
                    <!-- <th>Active</!-->
                    <th>Table</th>
                    <th>Filter</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Steps</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(value, name) in characteristics" :key="name">
                    <td><input class="rounded-input" v-model="value.dispName"></td>
                    <!-- <td><input type="checkbox" v-model="value.active" disabled=true></td> -->
                    <td><input type="checkbox" v-model="value.display"></td>
                    <td><input type="checkbox" v-model="value.filter"></td>
					<td><input type="number" v-model.number="value.min"></td>
					<td><input type="number" v-model.number="value.max"></td>
					<td><input type="number" v-model.number="value.intervals"></td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
  name: "Characteristics",
  props: {
      characteristics: Object
  }
};



</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .characteristics-table {
		display: inline-block;
        white-space: pre;
    }

    table {
        margin: 0;
    }

    table thead th {
        position: sticky;
        top: 0;
        background-color: white;
        border: 0;
    }

    .table-sm td,th {
        padding: 5px 10px !important;
    }
	input[type="number"] { width: 60px; float: left; text-align: right; }

    
</style>
