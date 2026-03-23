<template>
    <div
      class="bg-accentDarkGray text-accentGray
        fixed top-header-height left-left-menu-width right-right-menu-width
        bottom-0 z-90 p-6"
    >
      <div class="p-6 border border-accentGray rounded w-fit flex gap-6 cursor-default">
        <div>
          <h1 class="text-2xl text-monolithicCyanTsunami">
            <span class="text-lycheeIce">E</span>asy<br>
            <span class="text-lycheeIce">R</span>elational<br>
            <span class="text-lycheeIce">M</span>odel<br>
            <span class="text-lycheeIce">D</span>esigner<br>
          </h1>
        </div>
        <p class="text-sm max-w-md self-end text-right text-textColor">
          {{ $t('mainMenu.description') }}
        </p>
      </div>
      <GitHubWidget />
    </div>
</template>

<script setup lang="ts">
import GitHubWidget from "@/components/designer/mainMenu/GitHubWidget.vue";
</script>
