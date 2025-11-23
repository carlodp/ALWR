import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Plus } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: agents } = useQuery({
    queryKey: ["/api/agents"],
  });

  const { data: resellers } = useQuery({
    queryKey: ["/api/resellers"],
  });

  const filteredUsers = users?.filter((user) =>
    `${user.firstName} ${user.lastName} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const getAgentData = (userId: string) => {
    const agentsList = Array.isArray(agents) ? agents : agents?.data;
    return agentsList?.find((a: any) => a.userId === userId);
  };

  const getResellerData = (userId: string) => {
    const resellersList = Array.isArray(resellers) ? resellers : resellers?.data;
    return resellersList?.find((r: any) => r.userId === userId);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
