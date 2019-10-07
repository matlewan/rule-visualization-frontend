import Vue from "vue";
import _ from 'lodash'; 
import App from "./App.vue";
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "core-js/fn/array/flat-map";

Vue.config.productionTip = false;

window.Vue = Vue;
new Vue({
  render: h => h(App)
}).$mount("#app");

