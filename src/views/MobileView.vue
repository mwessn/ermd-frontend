<template>
    <div class="flex flex-col gap-3 bg-backgroundDark p-8 full">
      <HeaderLogo />
      <GitHubWidget class="mb-6" />
      <div class="flex">
        <div class="text-2xl font-bold text-textColor">
          <p class="text-5xl">
            {{ $t('mobile.title') }}
          </p>
          <p class="text-2xl">
            {{ $t('mobile.notAvailable') }}
          </p>
          <p>{{ $t('mobile.devices') }}</p>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import HeaderLogo from "@/components/designer/mainMenu/HeaderLogo.vue";
import GitHubWidget from "@/components/designer/mainMenu/GitHubWidget.vue";
</script>
