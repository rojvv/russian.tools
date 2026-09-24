<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";

let { sections }: {
  sections: { title: string; rows: { label: string; form: string }[] }[];
} = $props();
const i18n = getI18n();
</script>

{#each sections as section}
  <h3>{i18n.t(section.title as MessageKey)}</h3>
  <table>
    <tbody>
      {#each section.rows as row}
        <tr>
          <th scope="row">{i18n.t(row.label as MessageKey)}</th>
          <td lang="ru">{row.form || "—"}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/each}

<style>
table { width: 100%; border-collapse: collapse; }
th, td { padding: 8px; text-align: left; border-bottom: 1px solid var(--border); }
th { font-weight: 500; }
h3 { font-size: 16px; margin: 20px 0 8px; }
</style>
