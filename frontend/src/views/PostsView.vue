<template>
  <div class="space-y-8">
    <section class="grid gap-6 lg:grid-cols-2">
      <article class="rounded-3xl border border-slate-800 bg-gradient-to-br from-fuchsia-500/10 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-fuchsia-900/30">
        <p class="text-xs uppercase tracking-[0.35em] text-fuchsia-200/70">Feed comunitário</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">Compartilhe descobertas e bastidores do laboratório</h1>
        <p class="mt-3 text-sm text-slate-300">
          Publique fotos e relatos das suas sessões de treino. Todo mundo pode curtir e comentar para acelerar o refinamento
          dos combos antes dos torneios.
        </p>
        <dl class="mt-6 grid grid-cols-2 gap-4 text-center text-sm text-slate-200">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <dt class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Posts ativos</dt>
            <dd class="mt-2 text-3xl font-semibold text-white">{{ posts.length }}</dd>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <dt class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Comentários</dt>
            <dd class="mt-2 text-3xl font-semibold text-white">{{ totalComments }}</dd>
          </div>
        </dl>
      </article>
      <form class="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 space-y-4" @submit.prevent="handleCreate">
        <header>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Novo post</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">Conte algo ao laboratório</h2>
        </header>
        <textarea
          v-model="form.content"
          class="input min-h-[140px]"
          placeholder="Detalhe uma descoberta, compartilhe resultados ou faça uma chamada para testes."
        ></textarea>
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <label class="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-slate-200">
            <input type="file" class="hidden" accept="image/*" @change="handleImageChange" />
            {{ imageUploading ? 'Enviando imagem...' : 'Adicionar imagem' }}
          </label>
          <button
            v-if="form.imageUrl"
            type="button"
            class="text-xs text-slate-400 underline"
            @click="removeImage"
          >
            Remover imagem
          </button>
        </div>
        <div v-if="form.imageUrl" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <img :src="form.imageUrl" alt="Prévia do post" class="w-full rounded-xl object-cover" />
        </div>
        <p class="text-xs text-amber-400" v-if="feedback">{{ feedback }}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-500">{{ postsStore.submitting ? 'Publicando...' : 'Todos podem ver e interagir.' }}</span>
          <button
            type="submit"
            class="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
            :disabled="!form.content.trim() || postsStore.submitting || imageUploading"
          >
            Publicar
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Linha do tempo</p>
          <h3 class="text-2xl font-semibold text-white">Atualizações recentes</h3>
        </div>
        <button type="button" class="text-sm text-slate-400" @click="refreshPosts" :disabled="postsStore.loading">
          {{ postsStore.loading ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </header>
      <div v-if="postsStore.loading && !posts.length" class="mt-6 text-sm text-slate-400">Carregando posts...</div>
      <div v-else class="mt-6 space-y-6">
        <article
          v-for="post in posts"
          :key="post.id"
          class="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5 space-y-4"
        >
          <header class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-white">{{ post.author.name || post.author.username }}</p>
              <p class="text-xs text-slate-500">{{ formatDate(post.createdAt) }}</p>
            </div>
            <button
              v-if="post.author.id === auth.user?.id"
              type="button"
              class="text-xs text-rose-300"
              @click="deletePost(post.id)"
            >
              Excluir
            </button>
          </header>
          <p class="text-sm text-slate-200 whitespace-pre-line">{{ post.content }}</p>
          <img v-if="post.imageUrl" :src="post.imageUrl" class="w-full rounded-2xl border border-slate-800" alt="Imagem do post" />
          <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <button
              type="button"
              class="flex items-center gap-2 rounded-full border px-4 py-1 text-sm transition"
              :class="post.likedByCurrentUser ? 'border-primary/40 bg-primary/10 text-primary-200' : 'border-slate-700 text-slate-200'"
              @click="toggleLike(post)"
            >
              <span>{{ post.likedByCurrentUser ? 'Curtido' : 'Curtir' }}</span>
              <span class="text-slate-400">{{ post.likeCount }}</span>
            </button>
            <span>{{ post.commentCount }} comentários</span>
          </div>

          <div class="space-y-3">
            <p v-if="!post.comments.length" class="text-xs text-slate-500">Seja o primeiro a comentar.</p>
            <ul v-else class="space-y-3">
              <li v-for="comment in post.comments" :key="comment.id" class="rounded-2xl border border-slate-800/70 bg-slate-950/70 p-3">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-100">{{ comment.author.name || comment.author.username }}</p>
                    <p class="text-xs text-slate-500">{{ formatDate(comment.createdAt) }}</p>
                  </div>
                </div>
                <p class="mt-2 text-sm text-slate-200 whitespace-pre-line">{{ comment.content }}</p>
              </li>
            </ul>
            <form class="flex gap-2" @submit.prevent="submitComment(post.id)">
              <input
                v-model="commentInputs[post.id]"
                class="input flex-1"
                placeholder="Adicionar comentário"
              />
              <button
                type="submit"
                class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                :disabled="!commentInputs[post.id]?.trim() || commentLoading[post.id]"
              >
                {{ commentLoading[post.id] ? 'Enviando...' : 'Comentar' }}
              </button>
            </form>
          </div>
        </article>
        <p v-if="!posts.length && !postsStore.loading" class="text-sm text-slate-500 text-center">
          Nenhum post foi publicado ainda. Seja o primeiro a registrar suas descobertas!
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';

import { usePostsStore } from '../stores/posts';
import { useAuthStore } from '../stores/auth';
import { uploadImage } from '../services/uploadService';
import { formatDate } from '../utils/format';

const postsStore = usePostsStore();
const auth = useAuthStore();

const form = reactive({
  content: '',
  imageUrl: '',
});
const feedback = ref('');
const imageUploading = ref(false);
const commentInputs = reactive({});
const commentLoading = reactive({});

const posts = computed(() => postsStore.posts);
const totalComments = computed(() => postsStore.posts.reduce((total, post) => total + post.commentCount, 0));

onMounted(() => {
  if (!postsStore.posts.length) {
    postsStore.fetchPosts();
  }
});

async function refreshPosts() {
  await postsStore.fetchPosts();
}

function resetForm() {
  form.content = '';
  form.imageUrl = '';
}

async function handleCreate() {
  if (!form.content.trim()) return;
  try {
    feedback.value = '';
    await postsStore.createPost({
      content: form.content.trim(),
      imageUrl: form.imageUrl || undefined,
    });
    feedback.value = 'Post publicado com sucesso.';
    resetForm();
  } catch (error) {
    feedback.value = error.message || 'Não foi possível publicar o post.';
  }
}

async function handleImageChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  imageUploading.value = true;
  feedback.value = '';
  try {
    const response = await uploadImage(file);
    form.imageUrl = response.url;
  } catch (error) {
    feedback.value = error.message || 'Falha ao enviar imagem.';
  } finally {
    imageUploading.value = false;
  }
}

function removeImage() {
  form.imageUrl = '';
}

async function deletePost(postId) {
  if (!window.confirm('Deseja remover este post?')) return;
  try {
    await postsStore.deletePost(postId);
  } catch (error) {
    feedback.value = error.message || 'Não foi possível remover o post.';
  }
}

async function toggleLike(post) {
  try {
    if (post.likedByCurrentUser) {
      await postsStore.unlikePost(post.id);
    } else {
      await postsStore.likePost(post.id);
    }
  } catch (error) {
    feedback.value = error.message || 'Erro ao atualizar curtida.';
  }
}

async function submitComment(postId) {
  const content = commentInputs[postId]?.trim();
  if (!content) return;
  commentLoading[postId] = true;
  try {
    await postsStore.addComment(postId, content);
    commentInputs[postId] = '';
  } catch (error) {
    feedback.value = error.message || 'Não foi possível enviar o comentário.';
  } finally {
    commentLoading[postId] = false;
  }
}
</script>
