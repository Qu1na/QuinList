<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BlogCover from '@/components/blog/BlogCover.vue'
import { getSegment, postPath, readingMinutes, type BlogPost } from '@/seo/blog'

const props = defineProps<{ post: BlogPost }>()
const seg = computed(() => getSegment(props.post.segment)!)
const date = computed(() =>
  new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(props.post.published)),
)
</script>

<template>
  <article class="group h-full">
    <RouterLink :to="postPath(post)" class="flex h-full flex-col">
      <BlogCover :segment="post.segment" class="transition-transform duration-300 group-hover:-translate-y-1" />
      <p class="mt-4 text-[13px] font-medium text-[#1868db]">{{ seg.name }}</p>
      <h3 class="ql-display mt-1.5 text-[20px] font-medium leading-snug text-[#101214] group-hover:text-[#1868db]">
        {{ post.h1 }}
      </h3>
      <p class="mt-2 line-clamp-3 flex-1 text-[15px] leading-relaxed text-[#42526e]">{{ post.excerpt }}</p>
      <p class="mt-4 text-[13px] text-[#42526e]">
        <time :datetime="post.published">{{ date }}</time> · {{ readingMinutes(post) }} min de lectura
      </p>
    </RouterLink>
  </article>
</template>
