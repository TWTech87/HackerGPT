# HackerGPT

HackerGPT is your indispensable digital companion in the world of hacking. Crafted with the unique needs of bug bounty hunters in mind, this AI-powered assistant stands at the forefront of hacking knowledge and assistance. Equipped with an extensive database of hacking techniques, tools, and strategies, HackerGPT is more than just an information resource—it's an active participant in your hacking journey. Whether you're a beginner looking to learn the ropes or a seasoned professional seeking deeper insights, HackerGPT is your ally in navigating the ever-changing landscape of hacking challenges.

## How does HackerGPT work?

When you ask a question, it's sent to our server. We verify user authenticity and manage your question quota based on whether you're a free or plus user. We then search our database for information that closely matches your question. For questions not in English, we translate them to find relevant information from our database. If a strong match is found, it's incorporated into the AI's response process. Your question is then securely passed to OpenAI or OpenRouter for processing, with no personal information sent. Responses vary based on the module:

- **HackerGPT**: A tuned version of Mixtral 8x7B with semantic search on our data.
- **GPT-4 Turbo**: The latest and greatest from OpenAI, paired with our unique prompt.

## What Makes HackerGPT Special?

HackerGPT isn't just an AI that can answer your hacking questions; it actually can hack with you using popular open-source hacking tools. To see all the tools you can use with HackerGPT, type `/tools`. If you want a quick guide on using a specific tool, like Subfinder, just type `/subfinder -h`.

Below are some of the notable tools available with HackerGPT:

- **[Subfinder](https://github.com/projectdiscovery/subfinder)** is a subdomain discovery tool designed to enumerate and uncover valid subdomains of websites efficiently through passive online sources.
- **[Katana](https://github.com/projectdiscovery/katana)** is a next-generation crawling and spidering framework designed for robust, efficient web enumeration.
- **[Naabu](https://github.com/projectdiscovery/naabu)** is a high-speed port scanning tool, focused on delivering efficient and reliable network exploration.

Oh, and yes, you can effortlessly use these tools without typing complex commands — simply select the tool you want and describe in your own words what you need to do.

Along with these, there are more tools available with HackerGPT.

## Getting Started with HackerGPT Locally

**1. Clone Repo**

```bash
git clone https://github.com/Hacker-GPT/HackerGPT.git
```

**2. Install Dependencies**

```bash
npm i
```

**3. Configure Environment Variables**

Initialize your environment settings by creating a `.env.local` file in the project's root directory. Simply duplicate the `.env.local.example` file, rename it to `.env.local`, and then update the values with your specific configurations. For HackerGPT usage, you'll need to modify the following entries:

```bash
SECRET_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
SECRET_HACKERGPT_SYSTEM_PROMPT=YOUR_HACKERGPT_SYSTEM_PROMPT
```

**4. Run App**

```bash
npm run dev
```

**5. Use It**

You should be able to start chatting.

## Have a feature request, question, comment?

You can get in touch with us through email at [github@hackergpt.chat](mailto:github@hackergpt.chat) or connect with us on [X](https://twitter.com/thehackergpt).

## Contributing Code

Interested in contributing to HackerGPT? Please see [CONTRIBUTING.md](https://github.com/Hacker-GPT/HackerGPT/blob/main/CONTRIBUTING.md) for setup instructions and guidelines for new contributors. As an added incentive, top contributors will have the opportunity to become part of the HackerGPT team.

## License

Licensed under the [GNU General Public License v3.0](https://github.com/Hacker-GPT/HackerGPT/blob/main/LICENSE)
