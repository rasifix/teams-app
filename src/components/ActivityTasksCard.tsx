import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActivityTask } from '../types';
import type { ActivityTaskInput } from '../services/activityService';
import { selectActivityTasks } from '../store/selectors/taskSelectors';
import AddActivityTaskModal from './AddActivityTaskModal';
import ConfirmDialog from './ConfirmDialog';

interface ActivityTasksCardProps {
  tasks: ActivityTask[] | undefined;
  currentPersonId?: string;
  canManage: boolean;
  canSignUp: boolean;
  onAdd: (task: ActivityTaskInput) => Promise<boolean>;
  onUpdate: (taskId: string, task: ActivityTaskInput) => Promise<boolean>;
  onDelete: (taskId: string) => Promise<boolean>;
  onSignUp: (taskId: string) => Promise<boolean>;
  onWithdraw: (taskId: string) => Promise<boolean>;
}

export default function ActivityTasksCard({ tasks, currentPersonId, canManage, canSignUp, onAdd, onUpdate, onDelete, onSignUp, onWithdraw }: ActivityTasksCardProps) {
  const { t } = useTranslation();
  const summary = selectActivityTasks({ tasks }, currentPersonId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editing = tasks?.find((task) => task.id === editingId);
  const deleting = tasks?.find((task) => task.id === deletingId);

  if (summary.totalCount === 0 && !canManage) return null;

  return <section className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">{t('tasks.title')}</h2>
      {canManage && <button type="button" onClick={() => setIsAddOpen(true)} className="btn-secondary btn-sm">{t('tasks.add')}</button>}
    </div>
    {summary.totalCount === 0 ? <p className="text-sm text-gray-500">{t('tasks.empty')}</p> : <ul className="space-y-3">
      {summary.tasks.map((task) => <li key={task.id} className="rounded border border-gray-200 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-gray-900">{task.name}</p>
            {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
            <p className={`text-sm ${task.isFulfilled ? 'text-green-700' : 'text-amber-700'}`}>
              {task.isFulfilled ? t('tasks.fulfilled') : t('tasks.needsMore')}
              {canManage && <> · {t('tasks.signedUpCount', { count: task.signedUpCount, required: task.requiredPeople })}</>}
              {canManage && task.isOverSubscribed && <> · {t('tasks.overSubscribed')}</>}
            </p>
          </div>
          {canSignUp && (task.isSignedUp
            ? <button type="button" onClick={() => void onWithdraw(task.id)} className="btn-secondary btn-sm">{t('tasks.withdraw')}</button>
            : <button type="button" onClick={() => void onSignUp(task.id)} className="btn-primary btn-sm">{t('tasks.signUp')}</button>)}
        </div>
        {canManage && <div className="mt-2 flex gap-3 text-sm">
          <button type="button" onClick={() => setEditingId(task.id)} className="text-blue-600">{t('common.actions.edit')}</button>
          <button type="button" onClick={() => setDeletingId(task.id)} className="text-red-600">{t('common.actions.delete')}</button>
        </div>}
      </li>)}
    </ul>}
    <AddActivityTaskModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={onAdd} />
    <AddActivityTaskModal isOpen={Boolean(editing)} onClose={() => setEditingId(null)} onSave={(task) => onUpdate(editingId ?? '', task)} task={editing} />
    <ConfirmDialog
      isOpen={Boolean(deleting)}
      title={t('tasks.deleteTitle')}
      message={t('tasks.deleteMessage', { name: deleting?.name })}
      confirmText={t('common.actions.delete')}
      cancelText={t('common.actions.cancel')}
      onConfirm={() => { if (deletingId) void onDelete(deletingId); setDeletingId(null); }}
      onCancel={() => setDeletingId(null)}
    />
  </section>;
}
