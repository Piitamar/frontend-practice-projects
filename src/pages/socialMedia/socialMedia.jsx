

const posts = [
  {
    id: 1,
    user: {
      name: "Angelica",
      avatar: "https://i.pravatar.cc/100?img=1",
    },
    createdAt: "2h",
    content: {
      type: "text",
      text: "Just another normal day.",
    },
  },
  {
    id: 2,
    user: {
      name: "Flins",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
    createdAt: "5h",
    content: {
      type: "image",
      url: "https://images.unsplash.com/photo-1519608487953-e999c86e7455",
    },
  },
];

function PostCard({ post }) {
    function handleLike() {
        //ws broadcast to server like event
        //save to database in the backend after broastcast
        //updateUI
    }

    function handleOpenComment() {
        //toggle comment box
        //load comments of post from database
        //handling writing comment and send to server
    }

    function handleSubmitComment() {
        //broadcast comment to server by ws
        //save to database in the backend after broastcast
        //updateUI
    }

    function handleRepost() {
        //changeUI to green
        //broadcast repost to server by ws
        //save to database in the backend after broastcast
    }
    
  return (
    <article className="w-full border-b border-gray-200 bg-white">
      {/* Top: avatar + name + date */}
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={post.user.avatar}
          alt={post.user.name}
          className="h-10 w-10 rounded-full object-cover"
        />

        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            {post.user.name}
          </span>

          <span className="text-sm text-gray-500">
            · {post.createdAt}
          </span>
        </div>
      </div>

      {/* Middle: content */}
      <div className="px-4 pb-3">
        {post.content.type === "text" && (
          <p className="whitespace-pre-wrap text-[15px] leading-6 text-gray-900">
            {post.content.text}
          </p>
        )}

        {post.content.type === "image" && (
          <img
            src={post.content.url}
            alt=""
            className="mt-1 w-full rounded-xl object-cover"
          />
        )}
      </div>

      {/* Bottom: actions */}
      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-500">
        <button className="flex items-center gap-2 hover:text-gray-900">
          <span>♡</span>
          <span>Like</span>
        </button>

        <button className="flex items-center gap-2 hover:text-gray-900">
          <span>💬</span>
          <span>Comment</span>
        </button>

        <button className="flex items-center gap-2 hover:text-gray-900">
          <span>↻</span>
          <span>Repost</span>
        </button>
      </div>
    </article>
  );
}

export default function SocialMedia() {
  return (
    <main className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}