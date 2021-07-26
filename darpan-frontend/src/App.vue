<template>
  <v-app id="inspire">
    <v-app-bar app color="primary">
      <v-spacer></v-spacer>
      <!-- <v-app-bar-title style="font-family: Beth Ellen">Darpan</v-app-bar-title> -->
      <h1 style="font-family: Beth Ellen">Darpan</h1>
      <v-spacer></v-spacer>
      <optionMenu />
    </v-app-bar>

    <v-main app>
      <router-view></router-view>
    </v-main>

    <v-bottom-navigation color="teal" :grow="true" app>
      <v-btn
        v-for="item in items"
        :key="item.id"
        @click="$router.push(item.path)"
        large
        icon
        color="primary"
      >
        <span>{{ item.title }}</span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script>
import optionMenu from "./components/OptionMenu.vue";
export default {
  name: "App",
  components: {
    optionMenu,
  },
  beforeCreate() {
    this.$vuetify.theme.dark = false;
  },
  data() {
    return {
      items: [
        { id: 1, title: "Photos", icon: "mdi-image", path: "/Photos" },
        { id: 2, title: "Albums", icon: "mdi-image-album", path: "/Albums" },
        {
          id: 3,
          title: "People",
          icon: "mdi-account-box",
          path: "/People",
        },
      ],
    };
  },
};
</script>
