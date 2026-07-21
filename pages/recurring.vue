<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Container from '~/components/Container.vue'
import FloatingButton from '~/components/FloatingButton.vue'
import SelectForm from '~/components/SelectForm.vue'
import { useShowScreen } from '~/composables/useShowScreen'
import { useAuth } from '~/composables/useLogin'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { useCategories } from '~/composables/useCategories'
import { useToast } from '~/components/Toast/useToast'
import Toast from '~/components/Toast/Toast.vue'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import RecurringExpenseList from '~/components/RecurringExpenseList/RecurringExpenseList.vue'
import type { RecurringExpense, Category } from '~/types'

const { user } = useAuth()
const { showToast } = useToast()
const { sortedCategories, fetchCategories } = useCategories()

const {
  expenses,
  paidCount,
  fetchExpenses,
  addExpense,
  editExpense,
  removeExpense,
} = useRecurringExpenses()

// ── Formulario de crear/editar ───────────────────────────────────────────────
const { showScreen: showForm, openScreen: openForm, closeScreen: closeForm } = useShowScreen()
const editingExpense = ref<RecurringExpense | null>(null)
const formName = ref('')
const formDescription = ref('')
const formHasFixed = ref(false)
const formFixedAmount = ref<number | null>(null)
const formCategory = ref<Category | Record<string, never>>({})

function openNewForm() {
  editingExpense.value = null
  formName.value = ''
  formDescription.value = ''
  formHasFixed.value = false
  formFixedAmount.value = null
  formCategory.value = {}
  openForm()
}

function openEditForm(expense: RecurringExpense) {
  editingExpense.value = expense
  formName.value = expense.name
  formDescription.value = expense.description ?? ''
  formHasFixed.value = expense.fixedAmount !== null
  formFixedAmount.value = expense.fixedAmount
  formCategory.value = sortedCategories.value.find(c => c.id === expense.categoryId) ?? {}
  openForm()
}

async function submitForm() {
  try {
    const cat = formCategory.value as Category
    if (!formName.value.trim()) {
      showToast('El nombre es requerido', 'error')
      return
    }
    if (!cat?.id) {
      showToast('La categoría es requerida', 'error')
      return
    }
    const amount = formHasFixed.value ? formFixedAmount.value : null
    if (editingExpense.value) {
      const ok = await editExpense(editingExpense.value.id, {
        name: formName.value.trim(),
        description: formDescription.value.trim() || '',
        fixedAmount: amount,
        categoryId: cat.id,
        categoryName: cat.name,
      })
      if (ok) showToast('Gasto actualizado')
      else showToast('Error al actualizar', 'error')
    } else {
      if (!user.value?.uid) return
      const id = await addExpense({
        userId: user.value.uid,
        name: formName.value.trim(),
        description: formDescription.value.trim() || '',
        fixedAmount: amount,
        categoryId: cat.id,
        categoryName: cat.name,
      })
      if (id) showToast('Gasto agregado')
      else showToast('Error al agregar', 'error')
    }
    closeForm()
  } catch (error) {
    console.log(error)
  }
}

async function handleDelete() {
  if (!editingExpense.value) return
  const ok = await removeExpense(editingExpense.value.id)
  if (ok) showToast('Gasto eliminado')
  else showToast('Error al eliminar', 'error')
  closeForm()
}

// ── Computed ─────────────────────────────────────────────────────────────────
const progressLabel = computed(() =>
  `${paidCount.value} / ${expenses.value.length} pagados`
)

onMounted(async () => {
  await fetchCategories()
  if (user.value) await fetchExpenses()
})
</script>

<template>
  <toast />

  <main class="flex flex-col min-h-screen mt-16 pb-28">
    <container class="flex flex-col gap-6">

      <header class="flex items-center gap-3">
        <button class="text-gray-500 hover:text-gray-800 transition-colors" @click="navigateTo('/')">
          <span class="text-2xl">←</span>
        </button>
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-heading">Pagos recurrentes</h1>
          <p v-if="expenses.length" class="text-sm text-gray-400">{{ progressLabel }}</p>
        </div>
      </header>

      <!-- Barra de progreso -->
      <div v-if="expenses.length" class="w-full bg-gray-100 rounded-full h-2">
        <div
          class="bg-purple-500 h-2 rounded-full transition-all duration-500"
          :style="{ width: `${expenses.length ? (paidCount / expenses.length) * 100 : 0}%` }"
        />
      </div>

      <!-- Lista de gastos -->
      <recurring-expense-list @edit="openEditForm" />

    </container>
  </main>

  <floating-button label="+ Agregar" color="blue" size="md" @click="openNewForm" />

  <!-- BottomSheet: crear / editar ─────────────────────────────────────────── -->
  <bottom-sheet
    :title="editingExpense ? 'Editar gasto' : 'Nuevo gasto recurrente'"
    allowClose
    :visible="showForm"
    showActionButtons
    :actionButtons="{
      closeButton: { label: 'Cancelar', icon: 'X', enabled: true, show: true },
      doneButton: { label: editingExpense ? 'Guardar' : 'Agregar', icon: 'X', enabled: true, show: true },
    }"
    @modalClose="closeForm"
    @modalDone="submitForm"
    @modalCancel="closeForm"
  >
    <template #modal-content>
      <div class="flex flex-col gap-5 pt-2">
        <input-form
          id="recurring-name"
          label="Nombre del gasto *"
          placeholder="Ej. Netflix, Arriendo, Luz..."
          v-model="formName"
        />

        <select-form
          label="Categoría *"
          v-model="formCategory"
          :options="sortedCategories"
        />

        <input-form
          id="recurring-desc"
          label="Descripción (opcional)"
          placeholder="Nota adicional..."
          v-model="formDescription"
        />

        <!-- Toggle monto fijo / variable -->
        <div>
          <label class="block text-sm font-medium leading-6 text-gray-900 mb-3">Tipo de monto</label>
          <div class="flex gap-3">
            <button
              type="button"
              class="flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all"
              :class="!formHasFixed
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-500'"
              @click="formHasFixed = false; formFixedAmount = null"
            >
              Variable
            </button>
            <button
              type="button"
              class="flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all"
              :class="formHasFixed
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-500'"
              @click="formHasFixed = true"
            >
              Fijo
            </button>
          </div>
        </div>

        <input-currency
          v-if="formHasFixed"
          id="recurring-amount"
          label="Monto fijo"
          v-model="formFixedAmount"
        />

        <!-- Eliminar (solo en edición) -->
        <button
          v-if="editingExpense"
          type="button"
          class="mt-2 w-full py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          @click="handleDelete"
        >
          Eliminar gasto
        </button>
      </div>
    </template>
  </bottom-sheet>
</template>
