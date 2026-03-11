import { AppLayout } from '@/components/layout/AppLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { AddCustomerForm } from '@/components/customers/AddCustomerForm'

export default function AddCustomerPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50 pb-24">
        <PageHeader
          title="Add Customer"
          subtitle="Register a new loan customer"
          backHref="/customers"
        />
        
        {/* Main Content Container */}
        <div className="p-6 max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AddCustomerForm />
        </div>
      </div>
    </AppLayout>
  )
}