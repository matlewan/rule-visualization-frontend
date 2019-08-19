<template>
    <div class="rule-filter">
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Filter</th>
                    <th class="range">Range</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(value, name) in activeCharacteristics" :key="name">
                    <td><label>{{ name }}</label></td
                    ><td> <vue-slider v-model="value.range" :max="Math.max(value.max, 1)" :min="0" :interval="value.step" /> </td>
                </tr>
            </tbody>
        </table>
        <button class="btn btn-primary">Add</button>
        <button class="btn btn-success">Apply</button>
        
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
      filters: []
  }},
  computed: {
      activeCharacteristics: function() {
          return Object.keys(this.characteristics)
                .filter(key => this.characteristics[key].filter)
                .reduce((obj, key) => {
                    obj[key] = this.characteristics[key];
                    return obj;
                }, {});
        }
  },
  components: {
      VueSlider
  }
};

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    table thead th {
        border: 0;
    }
    .rule-filter {
        min-width: 300px;
        flex-grow: 0;
        float: left;
    }
    .btn {
        margin-right: 10px;
    }
  
</style>
