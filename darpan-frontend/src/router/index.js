import Vue from "vue";
import VueRouter from "vue-router";
import Photos from "../views/Photos.vue";
import Import from "../views/Import.vue";
import Login from "../views/Login.vue";
import Albums from "../views/Albums.vue";
import Album from "../views/Album.vue";
import Bin from "../views/Bin.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
  },
  {
    path: "/Photos",
    name: "Photos",
    component: Photos,
  },
  {
    path: "/Albums",
    name: "Albums",
    component: Albums,
  },
  {
    path: "/Album/:id",
    name: "Album",
    component: Album,
  },
  {
    path: "/Import",
    name: "Import",
    component: Import,
  },
  {
    path: "/Bin",
    name: "Bin",
    component: Bin,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
