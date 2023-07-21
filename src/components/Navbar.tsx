import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
const navigation = [
  {
    name: "About",
    href: "https://github.com/a16z-infra/companion-app",
    current: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { userId } = auth();
  return (
    <div className="bg-gray-900 w-full fixed top-0 z-10">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-start">
            <div className="flex flex-shrink-0 items-center">
              <Image
                width={0}
                height={0}
                sizes="100vw"
                className="block h-8 w-auto lg:hidden rounded-lg"
                src="https://avatars.githubusercontent.com/u/745163?s=200&v=4"
                alt="a16z"
              />
              <Image
                width={0}
                height={0}
                sizes="100vw"
                className="hidden h-8 w-auto lg:block rounded-lg"
                src="https://avatars.githubusercontent.com/u/745163?s=200&v=4"
                alt="a16z"
              />
            </div>
            <div className="ml-6">
              <div className="flex space-x-2 sm:space-x-4">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      "rounded-md px-3 py-2 text-sm font-medium"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </a>
                ))}
                <div className="px-3 py-2 text-gray-300">
                  <iframe
                    src="https://ghbtns.com/github-btn.html?user=a16z-infra&repo=companion-app&type=star&count=true"
                    frameBorder="0"
                    scrolling="0"
                    width="150"
                    height="20"
                    title="GitHub"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {userId ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <Link
                href="/sign-in"
                className="rounded-md bg-gray-800 py-2 px-3 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
