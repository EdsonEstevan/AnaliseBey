import { defineStore } from 'pinia';

import api from '../services/apiClient';

const defaultState = () => ({
  posts: [],
  loading: false,
  submitting: false,
});

export const usePostsStore = defineStore('posts', {
  state: defaultState,
  actions: {
    async fetchPosts(limit = 50) {
      this.loading = true;
      try {
        const { data } = await api.get('/posts', { params: { limit } });
        this.posts = data;
      } finally {
        this.loading = false;
      }
    },
    async createPost(payload) {
      this.submitting = true;
      try {
        const { data } = await api.post('/posts', payload);
        this.posts = [data, ...this.posts];
        return data;
      } finally {
        this.submitting = false;
      }
    },
    async deletePost(postId) {
      await api.delete(`/posts/${postId}`);
      this.posts = this.posts.filter((post) => post.id !== postId);
    },
    async addComment(postId, content) {
      const { data } = await api.post(`/posts/${postId}/comments`, { content });
      this.replacePost(data);
      return data;
    },
    async likePost(postId) {
      const { data } = await api.post(`/posts/${postId}/likes`);
      this.replacePost(data);
      return data;
    },
    async unlikePost(postId) {
      const { data } = await api.delete(`/posts/${postId}/likes`);
      this.replacePost(data);
      return data;
    },
    replacePost(updated) {
      this.posts = this.posts.map((post) => (post.id === updated.id ? updated : post));
    },
    reset() {
      Object.assign(this, defaultState());
    },
  },
});
