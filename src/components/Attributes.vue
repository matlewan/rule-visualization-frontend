<template>
    <div class="attributes-table scrollbar">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Name</th>
                    <!-- <th>Min</th>
                    <th>Max</th> -->
                    <!-- <th>Type</th> -->
                    <th>G/C</th>
                    <!-- <th>Value</th> -->
                    <th>Type / Domain</th>
                    <th>Active</th>
                    <th>Filter</th>
					<th>Example</th>
                    <!-- <th>Display</th> -->
                </tr>
            </thead>
            <tbody>
                <tr v-for="attribute of attributes" :key="attribute.id">
                    <td><input class="rounded-input" v-model="attribute.name"></td>
                    <!-- <td>{{ atribute.min }}</td>
                    <td>{{ attribute.max }}</td> -->
                    <!-- <td>{{ attribute.type }}</td> -->
                    <td>{{ attribute.preferenceType }}</td>
                    <!-- <td>{{ attribute.valueType }}</td> -->
                    <td>{{ attribute.domain != undefined ? attribute.domain.join(', ') : attribute.valueType }}</td>
                    <td><input type="checkbox" v-model="attribute.active" disabled=true></td>
                    <td><input type="checkbox" v-model="attribute.dispFilter"></td>
                    <td><input type="checkbox" v-model="attribute.example"></td>
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
    .attributes-table {
        height: 50vh;
        overflow: auto;
        white-space: pre;
        flex-grow: 1;
        float: left;
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

    
</style>
