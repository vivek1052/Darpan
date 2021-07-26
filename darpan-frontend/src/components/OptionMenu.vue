<template>
  <v-menu left bottom offset-y transition="scroll-x-reverse-transition">
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-on="on" v-bind="attrs">
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        dense
        v-for="option in options"
        :key="option.id"
        @click="$router.push(option.path)"
      >
        <v-list-item-icon>
          <v-icon>{{ option.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ option.title }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  name: "OptionMenu",
  data() {
    return {
      options: [
        {
          id: 1,
          title: "Import",
          icon: "mdi-file-import-outline",
          path: "/Import",
        },
        {
          id: 2,
          title: "Re-Index",
          icon: "mdi-reload",
        },
        {
          id: 3,
          title: "Settings",
          icon: "mdi-application-cog",
        },
        {
          id: 4,
          title: "Bin",
          icon: "mdi-delete-outline",
          path: "/Bin",
        },
      ],
    };
  },
};
</script>