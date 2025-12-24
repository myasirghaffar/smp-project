import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, CheckCircle2, Clock, DollarSign, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Payment {
  id: string;
  mission_id: string;
  client_id: string;
  student_id: string;
  amount: number;
  currency: string;
  status: string;
  escrow_status: string;
  stripe_payment_intent_id: string;
  created_at: string;
  completed_at: string | null;
  missions: {
    title: string;
    status: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
}

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          missions!inner(title, status),
          profiles!payments_student_id_fkey(full_name, email)
        `)
        .or(`client_id.eq.${user.id},student_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      succeeded: "default",
      pending: "secondary",
      failed: "destructive",
      canceled: "outline",
      refunded: "destructive",
    };

    const icons: Record<string, JSX.Element> = {
      succeeded: <CheckCircle2 className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      canceled: <XCircle className="h-3 w-3" />,
      refunded: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status] || "outline"} className="gap-1">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEscrowBadge = (escrowStatus: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      held: "secondary",
      released: "default",
      refunded: "destructive",
    };

    return (
      <Badge variant={variants[escrowStatus] || "outline"}>
        {escrowStatus === "held" && "🔒 "}
        {escrowStatus === "released" && "✅ "}
        {escrowStatus === "refunded" && "↩️ "}
        {escrowStatus.charAt(0).toUpperCase() + escrowStatus.slice(1)}
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const filterPayments = (filter: string) => {
    switch (filter) {
      case "all":
        return payments;
      case "pending":
        return payments.filter((p) => p.escrow_status === "held" && p.status === "succeeded");
      case "released":
        return payments.filter((p) => p.escrow_status === "released");
      case "failed":
        return payments.filter((p) => ["failed", "canceled", "refunded"].includes(p.status));
      default:
        return payments;
    }
  };

  const calculateStats = () => {
    const stats = {
      total: payments.length,
      pending: payments.filter((p) => p.escrow_status === "held" && p.status === "succeeded").length,
      released: payments.filter((p) => p.escrow_status === "released").length,
      failed: payments.filter((p) => ["failed", "canceled", "refunded"].includes(p.status)).length,
      totalAmount: payments
        .filter((p) => p.status === "succeeded")
        .reduce((sum, p) => sum + p.amount, 0),
      heldAmount: payments
        .filter((p) => p.escrow_status === "held" && p.status === "succeeded")
        .reduce((sum, p) => sum + p.amount, 0),
    };
    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading payments...</div>
        </div>
        <Footer />
      </div>
    );
  }

  const PaymentTable = ({ payments }: { payments: Payment[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mission</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead>Escrow Status</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Stripe ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-gray-500">
              No payments found
            </TableCell>
          </TableRow>
        ) : (
          payments.map((payment) => (
            <TableRow
              key={payment.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/missions/${payment.mission_id}`)}
            >
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{payment.missions.title}</div>
                  <div className="text-xs text-gray-500">Mission: {payment.missions.status}</div>
                </div>
              </TableCell>
              <TableCell className="font-semibold">
                {formatAmount(payment.amount, payment.currency)}
              </TableCell>
              <TableCell>{getStatusBadge(payment.status)}</TableCell>
              <TableCell>{getEscrowBadge(payment.escrow_status)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{payment.profiles?.full_name || "Unknown"}</div>
                  <div className="text-xs text-gray-500">{payment.profiles?.email}</div>
                  <div className="text-xs text-gray-400">
                    {payment.client_id === user?.id ? "Student" : "Client"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-xs font-mono text-gray-400">
                {payment.stripe_payment_intent_id?.substring(0, 20)}...
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor all transactions and escrow statuses</p>
            </div>
            <Button onClick={fetchPayments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Pending Release</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
              <div className="text-sm text-orange-600 mt-1">
                {formatAmount(stats.heldAmount, "eur")} held
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Released</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.released}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-700">Failed/Refunded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Transactions
            </CardTitle>
            <CardDescription>
              View and manage all payment transactions with detailed status information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="released">Released ({stats.released})</TabsTrigger>
                <TabsTrigger value="failed">Failed ({stats.failed})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <PaymentTable payments={filterPayments("all")} />
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <PaymentTable payments={filterPayments("pending")} />
              </TabsContent>

              <TabsContent value="released" className="mt-4">
                <PaymentTable payments={filterPayments("released")} />
              </TabsContent>

              <TabsContent value="failed" className="mt-4">
                <PaymentTable payments={filterPayments("failed")} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentDashboard;
