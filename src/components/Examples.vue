<template>
    <div v-if="attributes.length > 0" style="float: left;">
    <h5>Examples</h5>
    <div class="examples scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="e in examples" :key="e['ID'].value">
                    <td @click="idx = e['ID'].desc ">Example {{ e['ID'].desc }}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <br>
    <h5>Example {{examples[idx-1].ID.desc }}</h5>
    <div class="example scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="(value, name) in examples[idx-1]" :key="name">
                    <td><label>{{ name }}</label></td>
                    <td>{{ (name == 'ID') ? value.value : value.desc }}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <button @click="idx = Math.max(idx-1, 1)" class="btn btn-secondary">&lt;</button>
    <button @click="idx = Math.min(idx+1, examples.length)" class="btn btn-secondary">&gt;</button>
    <button @click="add" class="btn btn-success">+</button>
    <button @click="del" class="btn btn-danger">-</button>
    <button @click="match" class="btn btn-success">Match</button>
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

export default {
  name: "Examples",
  props: {
      attributes: Array,
      examples: Array
  },
  data() { return {
      conditionLike: '',
      all: false,
      aOperator: "OR",
      dOperator: "",
      activetab: 1,
      idx: 1
  }},
  methods: {
      match, add, del
  }
};

function match() {
    var data = {
        example: this.examples[this.idx-1]
    };
    this.$parent.$emit('match', this.$event, data);
}

function add() {

}

function del() {

}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    input[type="radio"] {
        margin-left: 20px;
    }

    table thead th {
        border: 0;
    }
    .examples,.example {
        flex-grow: 0;
        margin-right: 10px;
        margin-bottom: 5px;
        overflow: auto;
        width: 350px;
    }
    .examples {
        max-height:20vh;
        margin-top: 10px;
        cursor: pointer;
    }
    .example {
        max-height: 50vh;
    }
    .examples label {
        max-width: 150px;
    }
    .examples input,.vue-slider {
        position: relative;
        background-color: white;
    }

    .btn {
        margin-right: 10px;
    }
    .vue-slider {
        min-width: 80px;
        max-width: 80px;
        float: left;
    }
    .search {
        margin-bottom: 5px;
        width: calc(100% - 15px);
    }
    input[type="number"] {
        width: 60px;
        float: left;
        border: 0;
        text-align: right;
    }
    
    .table-sm td {
        padding: 0.1rem;
    }

    .table {
        margin-bottom: 0;
    }


    td label {
        margin-top: 0.2rem;
        margin-bottom: 0.2rem;
    }

    .svg-cancel {
        height: 80%;
    }

    .form-control-sm {
        height: calc(1rem + 10px);
        padding: 0;
    }
    
  
</style>
