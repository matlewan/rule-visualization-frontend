<template>
    <div v-if="attributes.length > 0" style="float: left;">
    <h5 v-if="decisions.length > 0">Decision</h5>
    <div class="d-filter scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="value in decisions" :key="value.id">
                    <td><label>{{ value.name }}</label></td>
                    <td><select name="operator" v-model="dOperator" class="form-control-sm">
                        <option value="">&isin;</option>
                        <option value=">=">&ge;</option>
                        <option value="<=">&le;</option>
                    </select></td>
                    <td><vue-slider class="slider" v-model="value.range" :max="Math.max(value.max, 1)" :min="0" :interval="1" :tooltip-formatter="val => value.domain[val]"/></td>
                </tr>
            </tbody>
        </table>
    </div>
    <h5>Characteristics</h5>
    <div class="c-filter scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="(value, name) in activeCharacteristics" :key="name">
                    <td><label>{{ value.name }}</label></td>
                    <td><input type="number" v-model="value.range[0]" :step="value.step" :min="0" :max="value.range[1]"></td>
                    <td><vue-slider class="slider" v-model="value.range" :max="Math.max(value.max, 1)" :min="0" :interval="value.step"/></td>
                    <td><input type="number" v-model="value.range[1]" :step="value.step" :min="value.range[0]" :max="Math.max(value.max, 1)"></td>
                </tr>
            </tbody>
        </table>
    </div>
    <br>
    <h5>Attributes</h5>
    <input @click="checkAll" type="checkbox" name="all" v-model="all"><label for="all">All</label>
    <input type="radio" name="operator" value="OR" v-model="aOperator"><label>OR</label>
    <input type="radio" name="operator" value="AND" v-model="aOperator"><label>AND</label>
    <!-- <input class="form-control form-control-sm search" type="text" placeholder="search..." v-model="conditionLike"> -->
    <div class="a-filter scrollbar">
        <table class="table table-sm">
            <tbody>
                <tr v-for="attribute in activeAttributes" :key="attribute.id">
                    <td><input type="checkbox" v-model="attribute.filter" :id="attribute.name"></td>
                    <td><label>{{ attribute.name }}</label></td>
                    <td><img class="svg-cancel" src="svg/cancel.svg" @click="off(attribute.name)"></td>
                </tr>
            </tbody>
        </table>
    </div>
    <button @click="clear" class="btn btn-primary">Reset</button>
    <button @click="emit" class="btn btn-success">Apply</button>
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'

export default {
  name: "FilterTab",
  props: {
      characteristics: Object,
      attributes: Array
  },
  data() { return {
      conditionLike: '',
      all: false,
      aOperator: "OR",
      dOperator: ""
  }},
  computed: {
    activeCharacteristics: function() {
          return Object.keys(this.characteristics)
                .filter(key => this.characteristics[key].filter)
                .reduce((obj, key) => {
                    obj[key] = this.characteristics[key];
                    return obj;
                }, {});
        },
    activeAttributes: function() {
          return this.attributes.filter(a => a.dispFilter && a.type == 'condition');
        },
    decisions: function() {
        return this.attributes.filter(a => a.dispFilter && a.type == 'decision')
    }
  },
  components: {
      VueSlider
  },
  methods: {
      clear, checkAll, off, emit
  }
};

function emit() {
    var data = {
        aOperator: this.aOperator,
        dOperator: this.dOperator
    };
    this.$emit('apply', this.$event, data);
}

function clear() {
    this.all = false;
    for (var i = 0; i < this.attributes.length; i++) {
        this.attributes[i].filter = false;
    }
    for (var elem of document.querySelectorAll('.a-filter input[type="checkbox"')) {
        elem.indeterminate = false;
    }
    for (var name in this.characteristics) {
        var c = this.characteristics[name];
        Vue.set(c.range, 0, c.min);
        Vue.set(c.range, 1, c.max);
    }
    this.dOperator = '';
    for (var decision of this.decisions) {
        Vue.set(decision.range, 0, 0);
        Vue.set(decision.range, 1, decision.max);
    }
}

function checkAll() {
    for (var i = 0; i < this.attributes.length; i++) {
        this.attributes[i].filter = !this.all;
    }
    for (var elem of document.querySelectorAll('.a-filter input[type="checkbox"')) {
        elem.indeterminate = false;
    }
}

function off(name) {
    this.attributes.filter(a => a.name == name)[0].filter = undefined;
    document.getElementById(name).indeterminate = true;
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
    .a-filter,.c-filter {
        flex-grow: 0;
        margin-right: 10px;
        margin-bottom: 5px;
        max-height: 30vh;
        overflow: auto;
        max-width: 400px;
    }
    .c-filter label {
        max-width: 150px;
    }
    .c-filter input,.vue-slider {
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
