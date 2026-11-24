<template>
    <a
      :href="appConfig.appGitHub"
      target="_blank"
      class="mt-4 px-4 py-3 border border-accentGray rounded
        flex items-center gap-4 w-fit
        hover:border-monolithicCyanTsunami transition-colors"
    >
      <FontAwesomeIcon
        :icon="faGithub"
        class="text-xl text-lycheeIce"
      />
      <span class="text-monolithicCyanTsunami font-semibold">{{ REPO_OWNER }}/{{ REPO_NAME }}</span>
      <span class="text-sm text-lycheeIce">v{{ appConfig.appVersion }}</span>
      <span
        v-if="description"
        class="text-sm"
      >
        {{ description }}
      </span>
      <span
        v-if="loaded"
        class="flex items-center gap-1 text-sm text-lycheeIce"
      >
        <FontAwesomeIcon :icon="faStar" />
        {{ stars }}
      </span>
    </a>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { appConfig } from "@/app.config.ts";

const REPO_OWNER = 'mwessn';
const REPO_NAME = 'ermd-frontend';

const description = ref<string | undefined>(undefined);
const stars = ref<number>(0);
const loaded = ref<boolean>(false);

onMounted(async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`);
    if (!res.ok) return;
    const data = await res.json();
    description.value = data.description ?? undefined;
    stars.value = data.stargazers_count;
    loaded.value = true;
  } catch {
    // Repo may be private
  }
});
</script>
