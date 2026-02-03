<template>
  <div class="min-h-screen flex flex-col lg:flex-row">
    <section class="flex-1 bg-slate-900/80 px-6 py-12 sm:px-12 lg:px-20 text-slate-50">
      <div class="max-w-xl">
        <p class="text-xs uppercase tracking-[0.45em] text-slate-500">Cadastro restrito</p>
        <h1 class="mt-6 text-4xl font-bold">Solicite sua vaga no laboratório Beyblade X</h1>
        <p class="mt-4 text-lg text-slate-200/90">
          Cada conta precisa de um <strong>código de acesso</strong> emitido pelo Edson. Dez códigos já estão reservados para distribuir entre técnicos e pilotos.
        </p>
        <div class="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-200">
          <p class="font-semibold text-emerald-200">Checklist para liberar o cadastro</p>
          <ul class="mt-3 space-y-2">
            <li>• Nome completo para identificar quem pilotou cada série.</li>
            <li>• Nome de usuário único (sem espaços) para login diário.</li>
            <li>• E-mail válido: usado para alertas e recuperação.</li>
            <li>• Código de acesso de 6+ caracteres fornecido pelo administrador.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="flex-1 bg-slate-950 px-6 py-12 sm:px-12 lg:px-16 text-slate-100">
      <div class="w-full max-w-lg mx-auto">
        <h2 class="text-2xl font-semibold">Criar nova conta</h2>
        <p class="text-sm text-slate-400">Preencha todos os campos para destravar o workspace.</p>

        <form class="mt-8 space-y-5" @submit.prevent="handleRegister">
          <div>
            <label class="block text-sm font-medium" for="name">Nome completo</label>
            <input
              id="name"
              v-model.trim="form.name"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-50 focus:border-primary focus:outline-none"
              placeholder="Kai Tanaka"
              required
              minlength="3"
              @input="clearError"
            />
          </div>
          <div>
            <label class="block text-sm font-medium" for="username">Usuário</label>
            <input
              id="username"
              v-model.trim="form.username"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-50 focus:border-primary focus:outline-none"
              placeholder="kai"
              required
              minlength="3"
              @input="clearError"
            />
          </div>
          <div>
            <label class="block text-sm font-medium" for="email">E-mail</label>
            <input
              id="email"
              v-model.trim="form.email"
              type="email"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-50 focus:border-primary focus:outline-none"
              placeholder="kai@laboratorio.com"
              required
              @input="clearError"
            />
          </div>
          <div>
            <label class="block text-sm font-medium" for="password">Senha</label>
            <input
              id="password"
              v-model.trim="form.password"
              type="password"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-50 focus:border-primary focus:outline-none"
              placeholder="••••••••"
              required
              minlength="6"
              @input="clearError"
            />
          </div>
          <div>
            <label class="block text-sm font-medium" for="access">Código de acesso</label>
            <input
              id="access"
              v-model.trim="form.accessCode"
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-base text-slate-50 focus:border-primary focus:outline-none"
              placeholder="EDSON-XXXX"
              required
              minlength="6"
              @input="handleAccessInput"
            />
          </div>
          <p v-if="error" class="text-sm text-rose-400">{{ error }}</p>
          <button
            type="submit"
            class="w-full rounded-xl bg-primary px-4 py-3 text-center text-base font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? 'Criando conta...' : 'Registrar e entrar' }}
          </button>
        </form>

        <p class="mt-6 text-sm text-slate-400">
          Já tem uma conta? <RouterLink class="text-primary font-semibold" to="/login">Voltar ao login</RouterLink>
        </p>
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
const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  accessCode: '',
});

const loading = computed(() => auth.loading);
const error = computed(() => auth.error);
const redirectTarget = computed(() => {
  const target = typeof route.query.redirect === 'string' ? route.query.redirect : null;
  return target && target !== '/register' ? target : '/';
});

function clearError() {
  if (auth.error) {
    auth.clearError?.();
  }
}

function handleAccessInput(event) {
  clearError();
  form.accessCode = event.target.value.toUpperCase();
}

async function handleRegister() {
  try {
    await auth.register({
      name: form.name,
      username: form.username,
      email: form.email,
      password: form.password,
      accessCode: form.accessCode,
    });
    router.replace(redirectTarget.value);
  } catch (err) {
    console.warn('Erro ao registrar:', err.message);
  }
}
</script>
