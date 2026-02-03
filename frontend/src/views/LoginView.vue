<template>
  <div class="min-h-screen lg:grid lg:grid-cols-2">
    <section class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 p-12 text-slate-50">
      <div>
        <p class="text-xs uppercase tracking-[0.45em] text-slate-400">Beyblade X Lab</p>
        <h1 class="mt-6 text-4xl font-bold leading-tight">Organize, teste e proteja seu laboratório tático</h1>
        <p class="mt-4 text-lg text-slate-200/90">
          Faça login para acessar dashboards, decks 3on3, simulações e o console da Assistente CX. Cada usuário enxerga apenas os seus dados.
        </p>
      </div>
      <ul class="space-y-3 text-sm text-slate-200/70">
        <li>• Tokens JWT com validade de 7 dias.</li>
        <li>• Sessões visitantes continuam disponíveis, mas sem salvamento.</li>
        <li>• Solicite ao Edson um código de acesso para novos cadastros.</li>
      </ul>
    </section>

    <section class="flex flex-col justify-center px-6 py-12 sm:px-12 bg-slate-950 text-slate-100">
      <div class="max-w-md w-full mx-auto">
        <div class="mb-10">
          <p class="text-xs uppercase tracking-[0.4em] text-slate-500">Área segura</p>
          <h2 class="mt-3 text-3xl font-semibold">Entrar no laboratório</h2>
          <p class="text-sm text-slate-400">Informe usuário e senha para liberar o workspace.</p>
        </div>
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm font-medium text-slate-300" for="username">Usuário</label>
            <input
              id="username"
              v-model.trim="form.username"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none"
              placeholder="edson"
              required
              @input="clearError"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300" for="password">Senha</label>
            <input
              id="password"
              v-model.trim="form.password"
              type="password"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-100 focus:border-primary focus:outline-none"
              placeholder="••••••••"
              required
              minlength="4"
              @input="clearError"
            />
          </div>
          <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>
          <button
            type="submit"
            class="w-full rounded-xl bg-primary px-4 py-3 text-center text-base font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="mt-6 flex flex-col gap-3">
          <button
            type="button"
            class="rounded-xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-900"
            :disabled="loading"
            @click="handleVisitor"
          >
            Explorar como Visitante
          </button>
          <p class="text-sm text-slate-400">
            Ainda não tem acesso? <RouterLink class="text-primary font-semibold" to="/register">Criar conta</RouterLink>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const form = reactive({ username: '', password: '' });
const loading = computed(() => auth.loading);
const error = computed(() => auth.error);

const redirectTarget = computed(() => {
  const target = typeof route.query.redirect === 'string' ? route.query.redirect : null;
  return target && target !== '/login' ? target : '/';
});

function clearError() {
  if (auth.error) {
    auth.clearError?.();
  }
}

async function handleLogin() {
  try {
    await auth.login({ username: form.username, password: form.password });
    router.replace(redirectTarget.value);
  } catch (err) {
    console.warn('Falha no login:', err.message);
  }
}

async function handleVisitor() {
  try {
    await auth.loginVisitor();
    router.replace(redirectTarget.value);
  } catch (err) {
    console.warn('Falha no login visitante:', err.message);
  }
}
</script>
