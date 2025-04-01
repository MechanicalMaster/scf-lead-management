import LeadDetails from "@/components/SCFleadmanagement/lead-details"
import Layout from "@/components/SCFleadmanagement/layout"

interface LeadDetailsPageProps {
  params: {
    id: string
  }
}

export default function LeadDetailsPage({ params }: LeadDetailsPageProps) {
  return (
    <Layout>
      <LeadDetails leadId={params.id} />
    </Layout>
  )
} 