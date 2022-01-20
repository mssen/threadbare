import path from 'path';
import type { GluegunToolbox } from 'gluegun';
import { Stream } from 'node:stream';

type DownloadMedia = (url: string, downloadFolder: string) => Promise<void>;

export interface Media {
  downloadMedia: DownloadMedia;
}

const extension = (toolbox: GluegunToolbox): void => {
  const { http, filesystem } = toolbox;

  const downloader = http.create({
    baseURL: '',
    responseType: 'stream',
  });

  const downloadMedia: DownloadMedia = async (url, downloadFolder) => {
    const fileName = path.basename(url);
    const localFilePath = path.resolve(__dirname, downloadFolder, fileName);
    const response = await downloader.get<Stream>(
      url,
      {},
      { responseType: 'stream' }
    );

    response.data?.pipe(filesystem.createWriteStream(localFilePath));

    return new Promise((resolve, reject) => {
      response.data?.on('end', () => {
        resolve();
      });

      response.data?.on('error', () => {
        reject();
      });
    });
  };

  toolbox.media = {
    downloadMedia,
  };
};

export default extension;
