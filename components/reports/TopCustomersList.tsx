import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TopCustomersList({ data }: { data: any[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Customers by total paid revenue</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((customer) => (
                        <div key={customer.email} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://avatar.vercel.sh/${customer.email}`} alt={customer.name} />
                                <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                            </div>
                            <div className="ml-auto font-medium">+${customer.totalPaid.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
