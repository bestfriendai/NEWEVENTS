import { NextRequest, NextResponse } from "next/server"
import type { EventDetailProps } from "@/components/event-detail-modal"

// Mock events data for testing
const mockEvents: EventDetailProps[] = [
  {
    id: 1,
    title: "Summer Music Festival 2025",
    description: "Join us for an incredible summer music festival featuring top artists from around the world. Experience live performances, food trucks, and amazing vibes in a beautiful outdoor setting.",
    date: "2025-07-15",
    time: "6:00 PM",
    location: "Central Park",
    address: "Central Park, New York, NY 10024",
    category: "Music",
    price: "$75 - $150",
    image: "/event-1.png",
    attendees: 2500,
    organizer: {
      name: "NYC Events Co.",
      description: "Premier event organizer in New York City",
      website: "https://nycevents.com"
    },
    ticketLinks: [
      {
        source: "Ticketmaster",
        link: "https://ticketmaster.com/event/1",
        price: "$75"
      },
      {
        source: "StubHub",
        link: "https://stubhub.com/event/1",
        price: "$85"
      }
    ],
    coordinates: {
      lat: 40.7829,
      lng: -73.9654
    }
  },
  {
    id: 2,
    title: "Tech Innovation Conference",
    description: "Discover the latest in technology innovation with keynote speakers from leading tech companies. Network with industry professionals and learn about cutting-edge developments.",
    date: "2025-06-20",
    time: "9:00 AM",
    location: "Javits Center",
    address: "429 11th Ave, New York, NY 10001",
    category: "Technology",
    price: "$200 - $500",
    image: "/event-2.png",
    attendees: 1200,
    organizer: {
      name: "Tech Forward",
      description: "Leading technology conference organizer",
      website: "https://techforward.com"
    },
    ticketLinks: [
      {
        source: "Eventbrite",
        link: "https://eventbrite.com/event/2",
        price: "$200"
      }
    ],
    coordinates: {
      lat: 40.7589,
      lng: -74.0020
    }
  },
  {
    id: 3,
    title: "Broadway Show: Hamilton",
    description: "Experience the revolutionary musical that tells the story of Alexander Hamilton. This award-winning production features incredible performances and unforgettable music.",
    date: "2025-06-25",
    time: "8:00 PM",
    location: "Richard Rodgers Theatre",
    address: "226 W 46th St, New York, NY 10036",
    category: "Arts & Theatre",
    price: "$89 - $299",
    image: "/event-3.png",
    attendees: 1319,
    organizer: {
      name: "Broadway Productions",
      description: "Premier Broadway show producer",
      website: "https://broadway.com"
    },
    ticketLinks: [
      {
        source: "Broadway.com",
        link: "https://broadway.com/hamilton",
        price: "$89"
      },
      {
        source: "Ticketmaster",
        link: "https://ticketmaster.com/hamilton",
        price: "$95"
      }
    ],
    coordinates: {
      lat: 40.7590,
      lng: -73.9845
    }
  },
  {
    id: 4,
    title: "Food & Wine Festival",
    description: "Taste amazing dishes from renowned chefs and sample wines from around the world. This culinary experience features cooking demonstrations and wine tastings.",
    date: "2025-07-10",
    time: "12:00 PM",
    location: "Brooklyn Bridge Park",
    address: "334 Furman St, Brooklyn, NY 11201",
    category: "Food & Drink",
    price: "$45 - $95",
    image: "/event-4.png",
    attendees: 800,
    organizer: {
      name: "Culinary Events NYC",
      description: "Gourmet food and wine event specialists",
      website: "https://culinaryeventsnyc.com"
    },
    ticketLinks: [
      {
        source: "Eventbrite",
        link: "https://eventbrite.com/food-wine",
        price: "$45"
      }
    ],
    coordinates: {
      lat: 40.7023,
      lng: -73.9969
    }
  },
  {
    id: 5,
    title: "Comedy Night Live",
    description: "Laugh out loud with some of the best comedians in the city. This comedy show features both established and up-and-coming comedic talent.",
    date: "2025-06-30",
    time: "7:30 PM",
    location: "Comedy Cellar",
    address: "117 MacDougal St, New York, NY 10012",
    category: "Comedy",
    price: "$25 - $40",
    image: "/event-5.png",
    attendees: 150,
    organizer: {
      name: "Laugh Track Productions",
      description: "Comedy show organizers",
      website: "https://laughtrack.com"
    },
    ticketLinks: [
      {
        source: "Comedy Cellar",
        link: "https://comedycellar.com",
        price: "$25"
      }
    ],
    coordinates: {
      lat: 40.7308,
      lng: -74.0020
    }
  },
  {
    id: 6,
    title: "Art Gallery Opening",
    description: "Discover contemporary art from emerging artists in this exclusive gallery opening. Meet the artists and enjoy wine and hors d'oeuvres.",
    date: "2025-07-05",
    time: "6:00 PM",
    location: "Chelsea Art Gallery",
    address: "525 W 22nd St, New York, NY 10011",
    category: "Arts & Theatre",
    price: "Free",
    image: "/event-6.png",
    attendees: 200,
    organizer: {
      name: "Chelsea Arts Collective",
      description: "Contemporary art gallery",
      website: "https://chelseaarts.com"
    },
    coordinates: {
      lat: 40.7465,
      lng: -74.0014
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Filter events based on parameters
    let filteredEvents = mockEvents
    
    if (category && category !== 'All') {
      filteredEvents = filteredEvents.filter(event => 
        event.category.toLowerCase() === category.toLowerCase()
      )
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json({
      events: filteredEvents.slice(0, limit),
      totalCount: filteredEvents.length,
      hasMore: filteredEvents.length > limit,
      page: 0,
      source: "mock-api",
      performance: {
        totalTime: 500,
        apiCalls: 1,
        cacheHits: 0
      }
    })
  } catch (error) {
    console.error('Error in events API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, category, limit = 20 } = body
    
    // Filter events based on parameters
    let filteredEvents = mockEvents
    
    if (category && category !== 'All') {
      filteredEvents = filteredEvents.filter(event => 
        event.category.toLowerCase() === category.toLowerCase()
      )
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return NextResponse.json({
      events: filteredEvents.slice(0, limit),
      totalCount: filteredEvents.length,
      hasMore: filteredEvents.length > limit,
      page: 0,
      source: "mock-api",
      performance: {
        totalTime: 300,
        apiCalls: 1,
        cacheHits: 0
      }
    })
  } catch (error) {
    console.error('Error in events API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
