<template>
    <div class="rule-table scrollbar">
        <table v-data-table class="table table-sm">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Conditions</th>
                    <th>Decision</th>
                    <th v-for="(value, name) in dispCharacteristics" :key="value.id">{{ name }}</th>
                </tr>
            </thead>
            <tbody>
                <!-- <RuleRow v-for="rule of rules" v-bind:rule="rule" v-bind:key="rule.id"></RuleRow> -->
                <tr v-for="rule of rules" :key="rule.id">
                    <td>{{ rule.id }}</td>
                    <td v-html="conditionsToString(rule.conditions)"></td>
                    <td v-html="decisionsToString(rule.decisions)"></td>
                    <td class="value" v-for="(value, name) in dispCharacteristics" :key="value.id">{{ round(rule.characteristics[name], 3) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

export default {
  name: "TableTab",
  props: {
      rules: Array,
      characteristics: Object
  },
  data() { return {
      filters: []
  }},
  computed: {
      activeCharacteristics: function() {
          return Object.keys(this.characteristics)
                .filter(key => this.characteristics[key].active)
                .reduce((obj, key) => {
                    obj[key] = this.characteristics[key];
                    return obj;
                }, {});
        },
        dispCharacteristics: function() {
            return Object.keys(this.characteristics).filter(key => this.characteristics[key].display)
                .reduce((obj, key) => {
                    obj[key] = this.characteristics[key];
                    return obj;
                }, {});
        }
  },
  components: {
      VueSlider
  },
  methods: {
      conditionsToString, decisionsToString, round
  } 
};

function operator(op) {
    if (op == ">=") return "\u2265";
    else if (op == "<=") return "\u2264";
    else return op;
}

function conditionsToString(conditions) {
    var result = "";
    for (var condition of conditions) {
        result += "\n" + condition.name + " " + operator(condition.operator) + " " 
                + "<span class=\"rule-value\">" + condition.description + "</span>";
    }
    return result.substr(1);
}

function decisionsToString(decisions) {
    var decision = decisions[0][0];
    return decision.name + " " + operator(decision.operator) + " " 
                + "<span class=\"rule-value\">" + decision.description + "</span>";
}

function round(num, precision) {
    var x = Math.pow(10, precision);
    return Math.round(num * x) / x;
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .rule-table {
        height: 95vh;
        max-width: 70vw;
        overflow: auto;
        white-space: pre;
        flex-grow: 1;
        float: left;
        margin-top: -30px;
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

    table tr td:first-child,th:first-child {
        position: sticky;
        left: 0;
        background-color: white;
    }
    table tr th:first-child {
        z-index: 1;
    }

    .value {
        text-align: right;
    }
    
</style>
