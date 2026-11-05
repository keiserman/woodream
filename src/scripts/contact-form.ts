// Sends every <form data-contact-form> in the background and shows the
// matching FormStatus message (success or error) from the same parent.

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-contact-form]')) {
  const parent = form.parentElement!;
  const done = parent.querySelector<HTMLElement>('[data-form-done]')!;
  const fail = parent.querySelector<HTMLElement>('[data-form-fail]')!;
  const submit = form.querySelector<HTMLInputElement>('input[type="submit"]')!;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    fail.hidden = true;

    // form.action falls back to the page URL, so check the attribute itself.
    if (!form.getAttribute('action')) {
      console.warn('Contact form has no endpoint; set formEndpoint in src/data/site.ts.');
      fail.hidden = false;
      return;
    }

    const label = submit.value;
    submit.value = submit.dataset.wait ?? label;
    submit.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Form endpoint answered ${response.status}`);
      form.hidden = true;
      done.hidden = false;
    } catch (error) {
      console.error(error);
      fail.hidden = false;
    } finally {
      submit.value = label;
      submit.disabled = false;
    }
  });
}
