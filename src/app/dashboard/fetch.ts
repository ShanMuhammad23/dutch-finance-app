export async function getOverviewData(organizationId?: number) {
  if (!organizationId) {
    // Return default values if no organization
    return {
      income: {
        value: 0,
        growthRate: 0,
      },
      expenses: {
        value: 0,
        growthRate: 0,
      },
      profit: {
        value: 0,
        growthRate: 0,
      },
    };
  }

  try {
    // Fetch from API route instead of direct database access
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(
      `${baseUrl}/api/financial-metrics?organizationId=${organizationId}&period=month`,
      { 
        cache: 'no-store',
        // Use absolute URL for server-side fetch
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch financial metrics')
    }

    const data = await response.json()

    return {
      income: {
        value: data.summary?.income || 0,
        growthRate: data.summary?.incomeGrowth || 0,
      },
      expenses: {
        value: data.summary?.expenses || 0,
        growthRate: data.summary?.expensesGrowth || 0,
      },
      profit: {
        value: data.summary?.profit || 0,
        growthRate: data.summary?.profitGrowth || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching overview data:', error);
    // Return default values on error
    return {
      income: {
        value: 0,
        growthRate: 0,
      },
      expenses: {
        value: 0,
        growthRate: 0,
      },
      profit: {
        value: 0,
        growthRate: 0,
      },
    };
  }
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}