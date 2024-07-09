<!-- src/routes/login/+page.svelte -->
<script context="module">
    import { redirect } from '@sveltejs/kit';
    import { signIn } from '@auth/sveltekit/client';
  
    export const load = async () => {
      await signIn('github');
      throw redirect(302, '/protected');
    };
</script>