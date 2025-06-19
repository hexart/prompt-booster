// apps/web/src/components/ModelSettings.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { type StandardModelType } from '@prompt-booster/core/model/models/config';
import { useModelStore } from '@prompt-booster/core/model/store/modelStore';
import { Dialog, ListCard, toast } from '@prompt-booster/ui';
import LoadingIcon from '@prompt-booster/ui/components/LoadingIcon';
import { useModal } from '@prompt-booster/ui/hooks/useModal';
import { Grid2X2PlusIcon, Power, Link2, FileCog, Trash2 } from 'lucide-react';
import { useModelConnection, useModelData, useModelEdit } from '../hooks/model-hooks';
import { ModelModal } from './ModelModal';
import { disableApiClientLogs } from '@prompt-booster/api/utils/apiLogging';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { useTranslation } from 'react-i18next';

// 在应用初始化时禁用 API 客户端日志
disableApiClientLogs();
// 确认删除对话框组件
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  danger?: boolean;
}> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  danger = false
}) => {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-md"
        title={title}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 button-cancel"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white ${danger
                ? "button-danger"
                : "button-confirm"
                }`}
            >
              {confirmText}
            </button>
          </div>
        }
      >
        <div>
          {message}
        </div>
      </Dialog>
    );
  };

// 主组件
export const ModelSettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    getCustomInterface,
  } = useModelStore();

  // 使用自定义钩子
  const { testConnection, isTestingConnection } = useModelConnection();
  const { allModels, toggleModelStatus, deleteModel, setActiveModel } = useModelData();
  const { saveModel } = useModelEdit();

  // 模态窗口状态
  const modalState = useModal<{
    editData: any;
    selectedModelId: string | null;
    isAddingCustom: boolean;
    isNewInterface: boolean;
  }>();

  const confirmDeleteModal = useModal<{
    interfaceId: string;
    interfaceName: string;
  }>();

  // 处理编辑标准模型
  const handleEditStandardModel = (modelType: StandardModelType) => {
    const model = allModels.find(m => m.id === modelType && m.isStandard);
    if (!model) return;

    modalState.openModal({
      editData: model.config,
      selectedModelId: modelType,
      isAddingCustom: false,
      isNewInterface: false
    });

    setActiveModel(modelType);
  };

  // 处理编辑自定义接口
  const handleEditCustomModel = (id: string) => {
    const customInterface = getCustomInterface(id);

    if (customInterface) {
      modalState.openModal({
        editData: {
          ...customInterface,
          id: id
        },
        selectedModelId: id,
        isAddingCustom: true,
        isNewInterface: false
      });

      setActiveModel(id);
    } else {
      toast.error(t('toast.noInterfaceToEdit'));
    }
  };

  // 处理编辑模型
  const handleEditModel = (id: string, isStandard: boolean) => {
    if (isStandard) {
      handleEditStandardModel(id as StandardModelType);
    } else {
      handleEditCustomModel(id);
    }
  };

  // 打开添加自定义接口弹窗
  const handleOpenAddCustomModal = () => {
    // 创建一个空的自定义接口数据
    const newCustomInterface = {
      id: '',
      name: '',
      providerName: '',
      apiKey: '',
      baseUrl: '',
      model: '',
      endpoint: '/chat/completions',
      enabled: false
    };

    modalState.openModal({
      editData: newCustomInterface,
      selectedModelId: null,
      isAddingCustom: true,
      isNewInterface: true
    });
  };

  // 处理保存模型
  const handleSaveModel = async (data: any, modelId: string | null) => {
    try {
      await saveModel(
        data,
        modelId,
        modalState.data?.isAddingCustom || false,
        modalState.data?.isNewInterface || false
      );
      modalState.closeModal();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 处理删除自定义接口
  const handleDeleteCustomInterface = (id: string) => {
    const interfaceToDelete = getCustomInterface(id);
    if (interfaceToDelete) {
      confirmDeleteModal.openModal({
        interfaceId: id,
        interfaceName: interfaceToDelete.name || id
      });
    } else {
      toast.error(t('toast.noInterfaceToDelete'));
    }
  };

  // 确认删除
  const handleConfirmDelete = () => {
    if (confirmDeleteModal.data) {
      deleteModel(confirmDeleteModal.data.interfaceId);
      confirmDeleteModal.closeModal();
    }
  };

  return (
    <div className="flex flex-col h-full p-4 border rounded-xl shadow-2xs secondary-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold title-secondary">{t('settings.title')}</h2>
        <Tooltip text={t('settings.addCustomModel')}>
          <button
            onClick={handleOpenAddCustomModal}
            className="px-3 py-2 text-sm inline-flex items-center gap-1 button-confirm"
          >
            <Grid2X2PlusIcon size={14} />
            <span className="hidden sm:block">{t('settings.add')}</span>
          </button>
        </Tooltip>
      </div>

      {/* 模型列表 */}
      <div className='flex-col h-full overflow-y-scroll pb-3'>
        {allModels.map((model, index) => (
          <motion.div
            key={model.id}
            className='mb-2 last:mb-0'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              ease: "easeOut"
            }}
          >
            <ListCard
              key={model.id}
              title={model.name}
              description={model.isStandard ? t('settings.builtInModel') : t('settings.customModel')}
              className={`border rounded-lg p-4 shadow-2xs hover:shadow-md transition-all duration-300 listcard-container ${!model.isEnabled ? 'opacity-50' : 'opacity-100'}`}
              renderTitle={(title) => (
                <h3 className="font-semibold text-lg truncate w-full listcard-title">{title}</h3>
              )}
              renderDescription={(desc) => (
                <div className="text-sm mt-1 truncate listcard-description">{desc}</div>
              )}
              actions={(
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleModelStatus(model.id, model.isStandard, !model.isEnabled)}
                    className={`px-3 py-2 text-sm whitespace-nowrap inline-flex items-center gap-1 ${model.isEnabled
                      ? "button-secondary-enabled"
                      : "button-secondary-disabled"
                      }`}
                  >
                    {model.isEnabled ? (
                      <Power size={14} />
                    ) : (
                      <Power size={14} />
                    )}
                    <span className="hidden md:inline whitespace-nowrap">{model.isEnabled ? t('settings.enabled') : t('settings.disabled')}</span>
                  </button>

                  <button
                    onClick={() => testConnection(model)}
                    className="px-3 py-2 text-sm inline-flex items-center gap-1 button-secondary-testlink"
                    disabled={isTestingConnection(model.id)}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {!isTestingConnection(model.id) ? (
                        <Link2 size={14} />
                      ) : (
                        <LoadingIcon />
                      )}
                    </div>
                    <span className="hidden md:inline whitespace-nowrap">{t('settings.testConnection')}</span>
                  </button>

                  <button
                    onClick={() => handleEditModel(model.id, model.isStandard)}
                    className="px-3 py-2 text-sm inline-flex items-center gap-1 button-secondary-edit"
                  >
                    <FileCog size={14} />
                    <span className="hidden md:inline whitespace-nowrap">{t('common.buttons.edit')}</span>
                  </button>

                  {!model.isStandard && (
                    <button
                      onClick={() => handleDeleteCustomInterface(model.id)}
                      className="px-3 py-2 text-sm inline-flex items-center gap-1 button-secondary-danger"

                    >
                      <Trash2 size={14} />
                      <span className="hidden md:inline whitespace-nowrap">{t('common.buttons.delete')}</span>
                    </button>
                  )}
                </div>
              )}
            />
          </motion.div>
        ))}

        {/* 空状态显示 */}
        {allModels.length === 0 && (
          <div className="text-center py-8 input-description">
            {t('settings.noModels')}
          </div>
        )}
      </div>

      {/* 编辑模型弹窗 */}
      {(modalState.isOpen || modalState.isClosing) && modalState.data && (
        <ModelModal
          isOpen={modalState.isOpen}
          onClose={modalState.closeModal}
          modelType={modalState.data.selectedModelId || '新接口'}
          initialData={modalState.data.editData}
          onSave={handleSaveModel}
          isCustom={modalState.data.isAddingCustom}
          isNewInterface={modalState.data.isNewInterface}
          modelId={modalState.data.selectedModelId}
        />
      )}

      {/* 删除确认弹窗 */}
      {(confirmDeleteModal.isOpen || confirmDeleteModal.isClosing) && confirmDeleteModal.data && (
        <ConfirmDialog
          isOpen={confirmDeleteModal.isOpen}
          onClose={confirmDeleteModal.closeModal}
          title={t('settings.confirmDeleteTitle')}
          message={t('settings.confirmDeleteMsg', { name: confirmDeleteModal.data.interfaceName })}
          confirmText={t('common.buttons.delete')}
          cancelText={t('common.buttons.cancel')}
          onConfirm={handleConfirmDelete}
          danger={true}
        />
      )}
    </div>
  );
};