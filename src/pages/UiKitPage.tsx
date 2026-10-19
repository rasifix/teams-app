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
            <PageTitle>{t('uiKit.title')}</PageTitle>
            <PageDescription>{t('uiKit.description')}</PageDescription>
          </PageHeaderContent>
          <Stack gap="sm">
            <ChoiceGroup aria-label={t('uiKit.theme')}>
              <Button size="sm" variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>{t('uiKit.light')}</Button>
              <Button size="sm" variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>{t('uiKit.dark')}</Button>
            </ChoiceGroup>
            <ChoiceGroup aria-label={t('uiKit.density')}>
              <Button size="sm" variant={density === 'default' ? 'primary' : 'secondary'} onClick={() => setDensity('default')}>{t('uiKit.defaultDensity')}</Button>
              <Button size="sm" variant={density === 'compact' ? 'primary' : 'secondary'} onClick={() => setDensity('compact')}>{t('uiKit.compactDensity')}</Button>
            </ChoiceGroup>
          </Stack>
        </PageHeader>

        <Stack gap="lg">
          <Panel>
            <SectionHeader>
              <SectionHeaderContent>
                <SectionTitle>{t('uiKit.actions')}</SectionTitle>
                <SectionDescription>{t('uiKit.actionsDescription')}</SectionDescription>
              </SectionHeaderContent>
            </SectionHeader>
            <Cluster>
              <Button>{t('uiKit.primary')}</Button>
              <Button variant="secondary">{t('uiKit.secondary')}</Button>
              <Button variant="ghost">{t('uiKit.ghost')}</Button>
              <Button variant="danger">{t('uiKit.danger')}</Button>
              <Button disabled>{t('uiKit.disabled')}</Button>
              <Button loading>{t('uiKit.loading')}</Button>
              <Button onClick={() => setModalOpen(true)}>{t('uiKit.openDialog')}</Button>
            </Cluster>
          </Panel>

          <ContentGrid variant="equal">
            <Panel>
              <SectionHeader>
                <SectionHeaderContent><SectionTitle>{t('uiKit.forms')}</SectionTitle></SectionHeaderContent>
              </SectionHeader>
              <Stack>
                <Field label={t('uiKit.name')} htmlFor="ui-kit-name" hint={t('uiKit.fieldHint')}>
                  <Input id="ui-kit-name" defaultValue={t('uiKit.sampleName')} />
                </Field>
                <Field label={t('uiKit.role')} htmlFor="ui-kit-role">
                  <Select id="ui-kit-role" defaultValue="player"><option value="player">{t('domain.player')}</option><option value="trainer">{t('domain.trainers')}</option></Select>
                </Field>
                <Field label={t('uiKit.notes')} htmlFor="ui-kit-notes">
                  <Textarea id="ui-kit-notes" defaultValue={t('uiKit.sampleNote')} />
                </Field>
                <Cluster gap="sm">
                  <Switch checked={switchChecked} onChange={() => setSwitchChecked(value => !value)} label={t('uiKit.notifications')} />
                  <span>{t('uiKit.notifications')}</span>
                </Cluster>
              </Stack>
            </Panel>

            <Panel>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('uiKit.feedback')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <Stack>
                <Alert tone="success">{t('uiKit.successMessage')}</Alert>
                <Alert tone="warning">{t('uiKit.warningMessage')}</Alert>
                <Alert tone="error">{t('uiKit.errorMessage')}</Alert>
                <Cluster>
                  <Badge tone="brand">{t('uiKit.brand')}</Badge>
                  <Badge tone="success">{t('uiKit.ready')}</Badge>
                  <Badge tone="warning">{t('uiKit.pending')}</Badge>
                </Cluster>
                <Legend>
                  <LegendItem><StatusMarker tone="success">✓</StatusMarker>{t('uiKit.ready')}</LegendItem>
                  <LegendItem><StatusMarker tone="warning">?</StatusMarker>{t('uiKit.pending')}</LegendItem>
                  <LegendItem><StatusMarker tone="danger">×</StatusMarker>{t('uiKit.failed')}</LegendItem>
                </Legend>
              </Stack>
            </Panel>
          </ContentGrid>

          <ContentGrid variant="equal">
            <Panel>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('uiKit.entities')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <EntityList>
                <EntityRow>
                  <EntityLeading><IconTile tone="brand">⚽</IconTile></EntityLeading>
                  <EntityContent><EntityTitle>{t('uiKit.sampleName')}</EntityTitle><EntityMeta>{t('uiKit.sampleMeta')}</EntityMeta></EntityContent>
                  <EntityActions><Button size="sm" variant="secondary">{t('common.actions.edit')}</Button></EntityActions>
                </EntityRow>
                <EntityRow selected>
                  <EntityLeading><IconTile tone="success">✓</IconTile></EntityLeading>
                  <EntityContent><EntityTitle>{t('uiKit.selectedEntity')}</EntityTitle><EntityMeta>{t('uiKit.selectedMeta')}</EntityMeta></EntityContent>
                </EntityRow>
              </EntityList>
            </Panel>

            <Panel>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('uiKit.properties')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <PropertyList>
                <PropertyRow><PropertyLabel>{t('uiKit.location')}</PropertyLabel><PropertyValue>{t('uiKit.sampleLocation')}</PropertyValue></PropertyRow>
                <PropertyRow><PropertyLabel>{t('uiKit.responsible')}</PropertyLabel><PropertyValue muted>{t('uiKit.unassigned')}</PropertyValue></PropertyRow>
              </PropertyList>
              <MetadataList><MetadataItem>📅 {t('uiKit.sampleDate')}</MetadataItem><MetadataItem>🕐 {t('uiKit.sampleTime')}</MetadataItem></MetadataList>
            </Panel>
          </ContentGrid>

          <Card>
            <CardBody>
              <SectionHeader><SectionHeaderContent><SectionTitle>{t('uiKit.table')}</SectionTitle></SectionHeaderContent></SectionHeader>
              <DataTable density="compact">
                <DataTableHead><DataTableRow><DataTableHeaderCell>{t('uiKit.name')}</DataTableHeaderCell><DataTableHeaderCell>{t('uiKit.role')}</DataTableHeaderCell><DataTableHeaderCell align="end">{t('uiKit.status')}</DataTableHeaderCell></DataTableRow></DataTableHead>
                <DataTableBody><DataTableRow interactive><DataTableCell strong>{t('uiKit.sampleName')}</DataTableCell><DataTableCell>{t('domain.player')}</DataTableCell><DataTableCell align="end"><Badge tone="success" size="sm">{t('uiKit.ready')}</Badge></DataTableCell></DataTableRow></DataTableBody>
              </DataTable>
            </CardBody>
          </Card>

          <EmptyState>{t('uiKit.empty')}</EmptyState>
        </Stack>
      </Page>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalHeader><ModalTitle>{t('uiKit.dialogTitle')}</ModalTitle></ModalHeader>
        <ModalBody>{t('uiKit.dialogBody')}</ModalBody>
        <ModalFooter><Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.actions.close')}</Button></ModalFooter>
      </Modal>
    </div>
  );
}
