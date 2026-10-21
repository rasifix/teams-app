import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  ChoiceGroup,
  Cluster,
  ContentGrid,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  EmptyState,
  EntityActions,
  EntityContent,
  EntityLeading,
  EntityList,
  EntityMeta,
  EntityRow,
  EntityTitle,
  Field,
  IconTile,
  Input,
  Legend,
  LegendItem,
  MetadataItem,
  MetadataList,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Page,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
  Panel,
  PropertyLabel,
  PropertyList,
  PropertyRow,
  PropertyValue,
  SectionDescription,
  SectionHeader,
  SectionHeaderContent,
  SectionTitle,
  Select,
  Stack,
  StatusMarker,
  Switch,
  Textarea,
} from '../components/ui';

type Theme = 'light' | 'dark';
type Density = 'default' | 'compact';

export default function UiKitPage() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);

  return (
    <div className="ui-kit-preview" data-theme={theme} data-density={density}>
      <Page>
        <PageHeader>
          <PageHeaderContent>
            <PageTitle>{t('page.uiKit.title')}</PageTitle>
            <PageDescription>{t('page.uiKit.description')}</PageDescription>
          </PageHeaderContent>
          <Stack gap="sm">
            <ChoiceGroup aria-label={t('page.uiKit.theme')}>
              <Button size="sm" variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>{t('page.uiKit.light')}</Button>
              <Button size="sm" variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>{t('page.uiKit.dark')}</Button>
            </ChoiceGroup>
            <ChoiceGroup aria-label={t('page.uiKit.density')}>
              <Button size="sm" variant={density === 'default' ? 'primary' : 'secondary'} onClick={() => setDensity('default')}>{t('page.uiKit.defaultDensity')}</Button>
              <Button size="sm" variant={density === 'compact' ? 'primary' : 'secondary'} onClick={() => setDensity('compact')}>{t('page.uiKit.compactDensity')}</Button>
            </ChoiceGroup>
          </Stack>
        </PageHeader>

        <Stack gap="lg">
          <Panel>
            <SectionHeader>
              <SectionHeaderContent>
                <SectionTitle>{t('page.uiKit.actions')}</SectionTitle>
                <SectionDescription>{t('page.uiKit.actionsDescription')}</SectionDescription>
              </SectionHeaderContent>
            </SectionHeader>
            <Cluster>
              <Button>{t('page.uiKit.primary')}</Button>
              <Button variant="secondary">{t('page.uiKit.secondary')}</Button>
              <Button variant="ghost">{t('page.uiKit.ghost')}</Button>
              <Button variant="danger">{t('page.uiKit.danger')}</Button>
              <Button disabled>{t('page.uiKit.disabled')}</Button>
              <Button loading>{t('page.uiKit.loading')}</Button>
              <Button onClick={() => setModalOpen(true)}>{t('page.uiKit.openDialog')}</Button>
            </Cluster>
          </Panel>

          <ContentGrid variant="equal">
            <Panel>
              <SectionHeader>
                <SectionHeaderContent><SectionTitle>{t('page.uiKit.forms')}</SectionTitle></SectionHeaderContent>
              </SectionHeader>
              <Stack>
                <Field label={t('page.uiKit.name')} htmlFor="ui-kit-name" hint={t('page.uiKit.fieldHint')}>
                  <Input id="ui-kit-name" defaultValue={t('page.uiKit.sampleName')} />
                </Field>
                <Field label={t('page.uiKit.role')} htmlFor="ui-kit-role">
                  <Select id="ui-kit-role" defaultValue="player"><option value="player">{t('domain.player.label')}</option><option value="trainer">{t('domain.trainer.label')}</option></Select>
                </Field>
                <Field label={t('page.uiKit.notes')} htmlFor="ui-kit-notes">
                  <Textarea id="ui-kit-notes" defaultValue={t('page.uiKit.sampleNote')} />
                </Field>
                <Cluster gap="sm">
                  <Switch checked={switchChecked} onChange={() => setSwitchChecked(value => !value)} label={t('page.uiKit.notifications')} />
                  <span>{t('page.uiKit.notifications')}</span>
                </Cluster>
              </Stack>
            </Panel>

            <Panel>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('page.uiKit.feedback')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <Stack>
                <Alert tone="success">{t('page.uiKit.successMessage')}</Alert>
                <Alert tone="warning">{t('page.uiKit.warningMessage')}</Alert>
                <Alert tone="error">{t('page.uiKit.errorMessage')}</Alert>
                <Cluster>
                  <Badge tone="brand">{t('page.uiKit.brand')}</Badge>
                  <Badge tone="success">{t('page.uiKit.ready')}</Badge>
                  <Badge tone="warning">{t('page.uiKit.pending')}</Badge>
                </Cluster>
                <Legend>
                  <LegendItem><StatusMarker tone="success">✓</StatusMarker>{t('page.uiKit.ready')}</LegendItem>
                  <LegendItem><StatusMarker tone="warning">?</StatusMarker>{t('page.uiKit.pending')}</LegendItem>
                  <LegendItem><StatusMarker tone="danger">×</StatusMarker>{t('page.uiKit.failed')}</LegendItem>
                </Legend>
              </Stack>
            </Panel>
          </ContentGrid>

          <ContentGrid variant="equal">
            <Panel>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('page.uiKit.entities')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <EntityList>
                <EntityRow>
                  <EntityLeading><IconTile tone="brand">⚽</IconTile></EntityLeading>
                  <EntityContent><EntityTitle>{t('page.uiKit.sampleName')}</EntityTitle><EntityMeta>{t('page.uiKit.sampleMeta')}</EntityMeta></EntityContent>
                  <EntityActions><Button size="sm" variant="secondary">{t('common.actions.edit')}</Button></EntityActions>
                </EntityRow>
                <EntityRow selected>
                  <EntityLeading><IconTile tone="success">✓</IconTile></EntityLeading>
                  <EntityContent><EntityTitle>{t('page.uiKit.selectedEntity')}</EntityTitle><EntityMeta>{t('page.uiKit.selectedMeta')}</EntityMeta></EntityContent>
                </EntityRow>
              </EntityList>
            </Panel>

            <Panel>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('page.uiKit.properties')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <PropertyList>
                <PropertyRow><PropertyLabel>{t('page.uiKit.location')}</PropertyLabel><PropertyValue>{t('page.uiKit.sampleLocation')}</PropertyValue></PropertyRow>
                <PropertyRow><PropertyLabel>{t('page.uiKit.responsible')}</PropertyLabel><PropertyValue muted>{t('page.uiKit.unassigned')}</PropertyValue></PropertyRow>
              </PropertyList>
              <MetadataList><MetadataItem>📅 {t('page.uiKit.sampleDate')}</MetadataItem><MetadataItem>🕐 {t('page.uiKit.sampleTime')}</MetadataItem></MetadataList>
            </Panel>
          </ContentGrid>

          <Card>
            <CardBody>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('page.uiKit.table')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <DataTable density="compact">
                <DataTableHead><DataTableRow><DataTableHeaderCell>{t('page.uiKit.name')}</DataTableHeaderCell><DataTableHeaderCell>{t('page.uiKit.role')}</DataTableHeaderCell><DataTableHeaderCell align="end">{t('page.uiKit.status')}</DataTableHeaderCell></DataTableRow></DataTableHead>
                <DataTableBody><DataTableRow interactive><DataTableCell strong>{t('page.uiKit.sampleName')}</DataTableCell><DataTableCell>{t('domain.player.label')}</DataTableCell><DataTableCell align="end"><Badge tone="success" size="sm">{t('page.uiKit.ready')}</Badge></DataTableCell></DataTableRow></DataTableBody>
              </DataTable>
            </CardBody>
          </Card>

          <EmptyState>{t('page.uiKit.empty')}</EmptyState>
        </Stack>
      </Page>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader><ModalTitle>{t('page.uiKit.dialogTitle')}</ModalTitle></ModalHeader>
        <ModalBody>{t('page.uiKit.dialogBody')}</ModalBody>
        <ModalFooter><Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.actions.close')}</Button></ModalFooter>
      </Modal>
    </div>
  );
}
