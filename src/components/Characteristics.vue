<template>
    <div class="characteristics-table scrollbar">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Active</th>
                    <th>Filter</th>
                    <th>Display</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(value, name) in characteristics" :key="name">
                    <td><input class="rounded-input" v-model="value.name"></td>
                    <td>{{ value.min }}</td>
                    <td>{{ value.max }}</td>
                    <td><input type="checkbox" v-model="value.active" disabled=true></td>
                    <td><input type="checkbox" v-model="value.filter"></td>
                    <td><input type="checkbox" v-model="value.display"></td>
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
