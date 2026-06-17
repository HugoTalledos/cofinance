<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Container from '~/components/Container.vue'
import FloatingButton from '~/components/FloatingButton.vue'
import SelectForm from '~/components/SelectForm.vue'
import { useShowScreen } from '~/composables/useShowScreen'
import { useAuth } from '~/composables/useLogin'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { useCategories } from '~/composables/useCategories'
import { useTransactions } from '~/composables/useTransactions'
import { useToast } from '~/components/Toast/useToast'
import Toast from '~/components/Toast/Toast.vue'
import InputCurrency from '~/components/InputForm/InputCurrency.vue'
import InputForm from '~/components/InputForm/InputForm.vue'
import type { RecurringExpense, Category } from '~/types'

const { user } = useAuth()
const { showToast } = useToast()
const { sortedCategories, fetchCategories } = useCategories()
const { addTransaction } = useTransactions()

const {
  expenses,
  loading,
  isPaid,
  paidAmount,
  paidAt,
  paidCount,
  fetchExpenses,
  addExpense,
  editExpense,
  removeExpense,
  markPaid,
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

// ── Crear transacción al marcar como pagado ──────────────────────────────────
async function createTransactionFromExpense(expense: RecurringExpense, amount: number) {
  if (!user.value?.uid || amount <= 0) return
  const today = new Date().toISOString().split('T')[0]
  await addTransaction({
    userId: user.value.uid,
    username: user.value.displayName || '',
    categoryId: expense.categoryId,
    categoryName: expense.categoryName,
    amount,
    description: expense.name,
    date: today,
    month: today.substring(0, 7),
  })
}

// ── Popup de monto variable ──────────────────────────────────────────────────
const { showScreen: showAmountPopup, openScreen: openAmountPopup, closeScreen: closeAmountPopup } = useShowScreen()
const pendingExpenseId = ref<string | null>(null)
const popupAmount = ref<number | null>(null)

async function handleTap(expense: RecurringExpense) {
  if (isPaid.value(expense.id)) return
  if (expense.fixedAmount !== null) {
    markPaid(expense.id, expense.fixedAmount)
    await createTransactionFromExpense(expense, expense.fixedAmount)
    return
  }
  pendingExpenseId.value = expense.id
  popupAmount.value = null
  openAmountPopup()
}

async function confirmVariableAmount() {
  if (!pendingExpenseId.value || popupAmount.value === null) return
  const id = pendingExpenseId.value
  const amount = popupAmount.value
  const expense = expenses.value.find(e => e.id === id)
  markPaid(id, amount)
  pendingExpenseId.value = null
  closeAmountPopup()
  if (expense) await createTransactionFromExpense(expense, amount)
}

function cancelAmountPopup() {
  pendingExpenseId.value = null
  closeAmountPopup()
}

// ── Computed ─────────────────────────────────────────────────────────────────
const progressLabel = computed(() =>
  `${paidCount.value} / ${expenses.value.length} pagados`
)

const pendingExpenseName = computed(() => {
  if (!pendingExpenseId.value) return ''
  return expenses.value.find(e => e.id === pendingExpenseId.value)?.name ?? ''
})

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
      <section v-if="loading" class="flex justify-center py-8">
        <span class="text-gray-400 text-sm">Cargando...</span>
      </section>

      <section v-else-if="expenses.length === 0" class="flex flex-col items-center gap-3 py-12 text-center">
        <span class="text-5xl">🔁</span>
        <p class="text-gray-500 text-sm">No tienes gastos recurrentes.<br>Agrega uno con el botón de abajo.</p>
      </section>

      <ul v-else class="flex flex-col gap-3">
        <li
          v-for="expense in expenses"
          :key="expense.id"
          class="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200"
          :class="isPaid(expense.id)
            ? 'bg-gray-50 border-gray-100 opacity-60'
            : 'bg-white border-gray-200 shadow-sm'"
        >
          <!-- Checkbox -->
          <button
            class="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200"
            :class="isPaid(expense.id)
              ? 'bg-gray-400 border-gray-400'
              : 'border-purple-400 hover:border-purple-600'"
            @click="handleTap(expense)"
          >
            <span v-if="isPaid(expense.id)" class="text-white text-xs font-bold">✓</span>
          </button>

          <!-- Info -->
          <div class="flex-1 min-w-0" @click="handleTap(expense)">
            <p
              class="font-semibold text-gray-800 transition-all duration-200"
              :class="{ 'line-through text-gray-400': isPaid(expense.id) }"
            >{{ expense.name }}</p>

            <p class="text-xs text-gray-400 truncate">{{ expense.categoryName }}</p>

            <p v-if="expense.description" class="text-xs text-gray-400 truncate">{{ expense.description }}</p>

            <!-- Monto -->
            <p class="text-xs mt-0.5 font-medium"
              :class="isPaid(expense.id) ? 'text-gray-400' : 'text-purple-600'"
            >
              <template v-if="isPaid(expense.id) && paidAmount(expense.id) !== null">
                {{ formatCurrency(paidAmount(expense.id)!) }}
              </template>
              <template v-else-if="expense.fixedAmount !== null">
                {{ formatCurrency(expense.fixedAmount) }}
              </template>
              <template v-else>
                Monto variable
              </template>
            </p>

            <!-- Fecha de pago -->
            <p v-if="isPaid(expense.id) && paidAt(expense.id)" class="text-xs text-gray-400 mt-0.5">
              Pagado el {{ new Date(paidAt(expense.id)!).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) }}
            </p>
          </div>

          <!-- Editar -->
          <button
            class="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-1"
            @click.stop="openEditForm(expense)"
          >
            <span class="text-lg">⋯</span>
          </button>
        </li>
      </ul>

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

  <!-- BottomSheet: monto variable ─────────────────────────────────────────── -->
  <bottom-sheet
    :title="`¿Cuánto pagaste por ${pendingExpenseName}?`"
    allowClose
    :visible="showAmountPopup"
    showActionButtons
    :actionButtons="{
      closeButton: { label: 'Cancelar', icon: 'X', enabled: true, show: true },
      doneButton: { label: 'Confirmar', icon: 'X', enabled: true, show: true },
    }"
    @modalClose="cancelAmountPopup"
    @modalDone="confirmVariableAmount"
    @modalCancel="cancelAmountPopup"
  >
    <template #modal-content>
      <div class="pt-2">
        <input-currency
          id="variable-amount"
          label="Monto pagado este periodo"
          v-model="popupAmount"
        />
      </div>
    </template>
  </bottom-sheet>
</template>
