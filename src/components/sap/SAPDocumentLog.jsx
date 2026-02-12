import { useTranslation } from 'react-i18next';
import { useSAP } from '../../context/SAPContext.jsx';
import DataTable from '../common/DataTable.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import { formatDate } from '../../utils/formatters.js';

export default function SAPDocumentLog() {
  const { t, i18n } = useTranslation();
  const { sapDocuments } = useSAP();

  const columns = [
    { key: 'documentNumber', label: t('sap.documentNumber'), render: (row) => <span className="font-mono font-bold text-brand">{row.documentNumber}</span> },
    { key: 'sourceModule', label: 'Source Module', render: (row) => <span className="capitalize">{row.sourceModule}</span> },
    { key: 'companyCode', label: t('sap.companyCode') },
    { key: 'fiscalYear', label: t('sap.fiscalYear') },
    { key: 'postingDate', label: t('sap.postingDate'), render: (row) => formatDate(row.postingDate, i18n.language) },
    { key: 'documentType', label: t('sap.docType') },
    { key: 'status', label: t('sap.postingStatus'), render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-positive/10 text-positive">
        {row.status}
      </span>
    ) },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-6">{t('sap.documentLog')}</h1>

      {sapDocuments.length === 0 ? (
        <div className="bg-bg-secondary rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-text-secondary">No SAP documents have been posted in this session.</p>
          <p className="text-xs text-text-secondary mt-2">Switch to the Accounting role and post approved documents to see them here.</p>
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={sapDocuments} />

          {/* Detail view for each document */}
          <div className="mt-6 space-y-4">
            {sapDocuments.map((doc) => (
              <div key={doc.documentNumber} className="bg-bg-secondary rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Document {doc.documentNumber} — GL Line Items
                  </h3>
                  <span className="text-xs text-text-secondary">{doc.sourceModule} / {doc.sourceRecordId}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-text-secondary py-2">Line</th>
                      <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('sap.glAccount')}</th>
                      <th className="text-left text-xs font-semibold text-text-secondary py-2">Account Name</th>
                      <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('sap.debit')}</th>
                      <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('sap.credit')}</th>
                      <th className="text-left text-xs font-semibold text-text-secondary py-2">Cost Center</th>
                      <th className="text-left text-xs font-semibold text-text-secondary py-2">Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.lineItems?.map((line, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="py-2 text-sm">{line.lineNumber}</td>
                        <td className="py-2 text-sm font-mono">{line.glAccount}</td>
                        <td className="py-2 text-sm">{line.glAccountName}</td>
                        <td className="py-2 text-sm text-right font-mono">{line.debit > 0 ? <AmountDisplay amount={line.debit} /> : '-'}</td>
                        <td className="py-2 text-sm text-right font-mono">{line.credit > 0 ? <AmountDisplay amount={line.credit} /> : '-'}</td>
                        <td className="py-2 text-sm font-mono">{line.costCenter || '-'}</td>
                        <td className="py-2 text-sm">{line.text || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
