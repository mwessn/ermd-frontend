<template>

</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store/settings.ts";

const { userDefinedColumnTypes } = storeToRefs(useSettingsStore());
</script>