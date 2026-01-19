import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  Edit2,
  History,
  Loader2,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminGetAllUsersWithWallets,
  adminRegisterUserWithWallet,
  adminSearchUserByWallet,
  adminUpdateUserWallet,
  adminVerifyWallet,
} from "@/services/adminWalletManagementService";
import { getWalletAuditLog } from "@/services/walletVerificationService";

type RoleCategory =
  | "judiciary"
  | "lawyer"
  | "clerk"
  | "police"
  | "public_party";

interface User {
  id: string;
  email: string | null;
  full_name: string;
  role_category: string;
  wallet_address: string | null;
  is_wallet_verified: boolean;
  wallet_verified_at: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by: { full_name: string } | null;
}

const AdminWalletManagement = () => {
  // Register New User State
  const [registerForm, setRegisterForm] = useState({
    email: "",
    fullName: "",
    walletAddress: "",
    roleCategory: "public_party" as RoleCategory,
    phone: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  // Users List State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Update Wallet State
  const [updateForm, setUpdateForm] = useState({
    profileId: "",
    newWalletAddress: "",
    reason: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [selectedUserForUpdate, setSelectedUserForUpdate] = useState<
    User | null
  >(null);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<User | null>(
    null,
  );

  // Verification Dialog
  const [verifyDialog, setVerifyDialog] = useState({
    open: false,
    userId: "",
    userName: "",
    currentStatus: false,
  });

  // Fetch all users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await adminGetAllUsersWithWallets();
      setUsers((data as any) || []);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  };

  // Register new user with wallet
  const handleRegisterUser = async () => {
    if (
      !registerForm.email || !registerForm.fullName ||
      !registerForm.walletAddress
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate wallet format
    if (!registerForm.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error(
        "Invalid wallet address format (should be 0x followed by 40 hex characters)",
      );
      return;
    }

    setRegisterLoading(true);
    try {
      const result = await adminRegisterUserWithWallet({
        email: registerForm.email,
        fullName: registerForm.fullName,
        walletAddress: registerForm.walletAddress,
        roleCategory: registerForm.roleCategory,
        phone: registerForm.phone || undefined,
      });

      if (result.success) {
        toast.success(
          `✅ User "${registerForm.fullName}" registered with wallet!`,
        );
        setRegisterForm({
          email: "",
          fullName: "",
          walletAddress: "",
          roleCategory: "public_party",
          phone: "",
        });
        await fetchUsers();
      } else {
        toast.error(result.error || "Failed to register user");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error registering user");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Search user by wallet
  const handleSearchUser = async () => {
    if (!searchQuery.trim()) {
      await fetchUsers();
      return;
    }

    setUsersLoading(true);
    try {
      const user = await adminSearchUserByWallet(searchQuery);
      if (user) {
        setUsers([(user as any) || {}]);
        toast.success("User found!");
      } else {
        setUsers([]);
        toast.error("Wallet not found");
      }
    } catch (error: any) {
      toast.error("Search failed");
    } finally {
      setUsersLoading(false);
    }
  };

  // Update user wallet
  const handleUpdateWallet = async () => {
    if (!updateForm.profileId || !updateForm.newWalletAddress) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!updateForm.newWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Invalid wallet address format");
      return;
    }

    setUpdateLoading(true);
    try {
      const result = await adminUpdateUserWallet({
        profileId: updateForm.profileId,
        newWalletAddress: updateForm.newWalletAddress,
        reason: updateForm.reason || "Admin updated",
      });

      if (result.success) {
        toast.success("✅ Wallet updated successfully!");
        setUpdateForm({ profileId: "", newWalletAddress: "", reason: "" });
        setSelectedUserForUpdate(null);
        await fetchUsers();
      } else {
        toast.error(result.error || "Failed to update wallet");
      }
    } catch (error: any) {
      toast.error(error?.message || "Error updating wallet");
    } finally {
      setUpdateLoading(false);
    }
  };

  // View audit log
  const handleViewAuditLog = async (user: User) => {
    setAuditLoading(true);
    try {
      const logs = await getWalletAuditLog(user.id);
      setAuditLogs((logs as any) || []);
      setSelectedUserForAudit(user);
    } catch (error: any) {
      toast.error("Failed to fetch audit log");
    } finally {
      setAuditLoading(false);
    }
  };

  // Toggle wallet verification
  const handleToggleVerification = async () => {
    setAuditLoading(true);
    try {
      const newStatus = !verifyDialog.currentStatus;
      const result = await adminVerifyWallet(verifyDialog.userId, newStatus);

      if (result.success) {
        toast.success(
          `✅ Wallet ${newStatus ? "verified" : "unverified"} successfully!`,
        );
        await fetchUsers();
        setVerifyDialog({
          open: false,
          userId: "",
          userName: "",
          currentStatus: false,
        });
      } else {
        toast.error(result.error || "Failed to update verification");
      }
    } catch (error: any) {
      toast.error("Error updating verification");
    } finally {
      setAuditLoading(false);
    }
  };

  const roleOptions: { value: RoleCategory; label: string; color: string }[] = [
    { value: "judiciary", label: "🏛️ Judiciary", color: "bg-amber-100" },
    { value: "lawyer", label: "👨‍⚖️ Lawyer", color: "bg-blue-100" },
    { value: "clerk", label: "📋 Clerk", color: "bg-cyan-100" },
    { value: "police", label: "🚔 Police", color: "bg-emerald-100" },
    { value: "public_party", label: "👤 Public Party", color: "bg-slate-100" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🔐 Admin Wallet Management
          </h1>
          <p className="text-slate-600">
            Manage user wallets, roles, and authentication
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border">
            <TabsTrigger value="register">
              <Plus className="w-4 h-4 mr-2" />
              Register User
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Edit2 className="w-4 h-4 mr-2" />
              Manage Wallets
            </TabsTrigger>
            <TabsTrigger value="users">
              <Search className="w-4 h-4 mr-2" />
              View Users
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* ====== TAB 1: REGISTER NEW USER ====== */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register New User with Wallet</CardTitle>
                <CardDescription>
                  Create a new user account and assign wallet address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="user@nyaysutra.court"
                      value={registerForm.email}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          email: e.target.value,
                        })}
                      className="border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      placeholder="Justice Sharma"
                      value={registerForm.fullName}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          fullName: e.target.value,
                        })}
                      className="border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Wallet Address *
                    </label>
                    <Input
                      placeholder="0x1234567890abcdef1234567890abcdef12345678"
                      value={registerForm.walletAddress}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          walletAddress: e.target.value,
                        })}
                      className="border-slate-200 font-mono text-xs"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Format: 0x followed by 40 hex characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Role *
                    </label>
                    <Select
                      value={registerForm.roleCategory}
                      onValueChange={(value) =>
                        setRegisterForm({
                          ...registerForm,
                          roleCategory: value as RoleCategory,
                        })}
                    >
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone (Optional)
                    </label>
                    <Input
                      placeholder="+91-9876543210"
                      value={registerForm.phone}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          phone: e.target.value,
                        })}
                      className="border-slate-200"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleRegisterUser}
                  disabled={registerLoading}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {registerLoading
                    ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    )
                    : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Register User
                      </>
                    )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== TAB 2: UPDATE WALLET ====== */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Update User Wallet</CardTitle>
                <CardDescription>
                  Change wallet address for existing user (creates audit trail)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedUserForUpdate
                  ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select User
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                        {users.length === 0
                          ? (
                            <p className="text-sm text-slate-500">
                              No users found
                            </p>
                          )
                          : (
                            users.map((user) => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setSelectedUserForUpdate(user);
                                  setUpdateForm({
                                    profileId: user.id,
                                    newWalletAddress: "",
                                    reason: "",
                                  });
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                              >
                                <div className="font-medium text-slate-900">
                                  {user.full_name}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {user.email}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                  {user.wallet_address || "No wallet"}
                                </div>
                              </button>
                            ))
                          )}
                      </div>
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-medium text-blue-900">
                          {selectedUserForUpdate.full_name}
                        </p>
                        <p className="text-sm text-blue-700">
                          {selectedUserForUpdate.email}
                        </p>
                        <p className="text-xs text-blue-600 font-mono mt-2">
                          Current:{" "}
                          {selectedUserForUpdate.wallet_address || "None"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          New Wallet Address *
                        </label>
                        <Input
                          placeholder="0x1234567890abcdef1234567890abcdef12345678"
                          value={updateForm.newWalletAddress}
                          onChange={(e) =>
                            setUpdateForm({
                              ...updateForm,
                              newWalletAddress: e.target.value,
                            })}
                          className="border-slate-200 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Reason for Change
                        </label>
                        <Input
                          placeholder="e.g., User lost wallet access"
                          value={updateForm.reason}
                          onChange={(e) =>
                            setUpdateForm({
                              ...updateForm,
                              reason: e.target.value,
                            })}
                          className="border-slate-200"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setSelectedUserForUpdate(null)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateWallet}
                          disabled={updateLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {updateLoading
                            ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            )
                            : (
                              <>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Update Wallet
                              </>
                            )}
                        </Button>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== TAB 3: VIEW USERS ====== */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Wallet Directory</CardTitle>
                <CardDescription>
                  Search and manage user wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by wallet address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-slate-200"
                  />
                  <Button
                    onClick={handleSearchUser}
                    variant="outline"
                    disabled={usersLoading}
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      fetchUsers();
                    }}
                    variant="outline"
                  >
                    Reset
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Wallet Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading
                        ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        )
                        : users.length === 0
                        ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-slate-500"
                            >
                              No users found
                            </TableCell>
                          </TableRow>
                        )
                        : (
                          users.map((user) => (
                            <TableRow
                              key={user.id}
                              className="hover:bg-slate-50"
                            >
                              <TableCell className="font-medium">
                                {user.full_name}
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {user.email}
                              </TableCell>
                              <TableCell>
                                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                  {user.role_category}
                                </span>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                                  {user.wallet_address
                                    ? `${user.wallet_address.slice(0, 6)}...${
                                      user.wallet_address.slice(-4)
                                    }`
                                    : "—"}
                                </code>
                              </TableCell>
                              <TableCell>
                                {user.wallet_address
                                  ? (
                                    user.is_wallet_verified
                                      ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                          <CheckCircle2 className="w-4 h-4" />
                                          <span className="text-xs">
                                            Verified
                                          </span>
                                        </div>
                                      )
                                      : (
                                        <div className="flex items-center gap-1 text-orange-600">
                                          <XCircle className="w-4 h-4" />
                                          <span className="text-xs">
                                            Unverified
                                          </span>
                                        </div>
                                      )
                                  )
                                  : (
                                    <span className="text-xs text-slate-500">
                                      —
                                    </span>
                                  )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setVerifyDialog({
                                        open: true,
                                        userId: user.id,
                                        userName: user.full_name,
                                        currentStatus: user.is_wallet_verified,
                                      })}
                                    disabled={!user.wallet_address}
                                    title="Toggle verification"
                                  >
                                    {user.is_wallet_verified ? "🔒" : "🔓"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewAuditLog(user)}
                                    title="View audit trail"
                                  >
                                    <History className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== TAB 4: AUDIT TRAIL ====== */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Audit Trail</CardTitle>
                <CardDescription>
                  {selectedUserForAudit
                    ? `Showing changes for ${selectedUserForAudit.full_name}`
                    : "Select a user to view their wallet audit trail"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUserForAudit && (
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {selectedUserForAudit.full_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {selectedUserForAudit.email}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUserForAudit(null)}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {!selectedUserForAudit
                  ? (
                    <div>
                      <p className="text-slate-600 mb-3">
                        Select a user from the list:
                      </p>
                      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3 bg-slate-50">
                        {users.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleViewAuditLog(user)}
                            className="w-full text-left p-2 rounded hover:bg-slate-200 transition-colors"
                          >
                            <div className="font-medium text-sm">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {user.email}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                  : (
                    <div className="border rounded-lg overflow-hidden">
                      {auditLoading
                        ? (
                          <div className="p-8 text-center">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                          </div>
                        )
                        : auditLogs.length === 0
                        ? (
                          <div className="p-8 text-center text-slate-500">
                            No audit logs for this user
                          </div>
                        )
                        : (
                          <div className="space-y-3 p-4">
                            {auditLogs.map((log) => (
                              <div
                                key={log.id}
                                className="border-l-4 border-blue-400 bg-blue-50 p-3 rounded"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {log.action.replace(/_/g, " ")
                                        .toUpperCase()}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                      By:{" "}
                                      {log.changed_by?.full_name || "System"}
                                    </p>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    {new Date(log.changed_at).toLocaleString()}
                                  </span>
                                </div>
                                {log.old_value && (
                                  <p className="text-xs text-slate-700 mt-2">
                                    Old:{" "}
                                    <code className="bg-slate-200 px-1 rounded">
                                      {log.old_value}
                                    </code>
                                  </p>
                                )}
                                {log.new_value && (
                                  <p className="text-xs text-slate-700">
                                    New:{" "}
                                    <code className="bg-slate-200 px-1 rounded">
                                      {log.new_value}
                                    </code>
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Verification Dialog */}
      <AlertDialog
        open={verifyDialog.open}
        onOpenChange={(open) => {
          if (!open) setVerifyDialog({ ...verifyDialog, open: false });
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {verifyDialog.currentStatus ? "Unverify" : "Verify"} Wallet?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to{" "}
            {verifyDialog.currentStatus ? "unverify" : "verify"} the wallet for
            {" "}
            <strong>{verifyDialog.userName}</strong>?
            {verifyDialog.currentStatus && (
              <p className="mt-2 text-orange-600 font-medium">
                ⚠️ Unverifying will prevent this user from logging in!
              </p>
            )}
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleVerification}
              disabled={auditLoading}
              className={verifyDialog.currentStatus
                ? "bg-orange-600"
                : "bg-green-600"}
            >
              {auditLoading
                ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                )
                : (
                  <>
                    {verifyDialog.currentStatus ? "Unverify" : "Verify"}
                  </>
                )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWalletManagement;
