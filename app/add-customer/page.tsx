import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { AddCustomerForm } from '@/components/customers/AddCustomerForm'

export default function AddCustomerPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Add Customer"
        subtitle="Register a new loan customer"
        backHref="/customers"
      />
      <div className="pb-6">
        <AddCustomerForm />
      </div>
    </AppLayout>
  )
}
